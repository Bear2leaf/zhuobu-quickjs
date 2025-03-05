#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "quickjs/quickjs.h"

#include <glad/glad.h>
#include <GLFW/glfw3.h>


#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#include "miniaudio.h"

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow* window);

// settings
unsigned int width = 1280;
unsigned int height = 760;


// process all input: query GLFW whether relevant keys are pressed/released this
// frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
void processInput(GLFWwindow* window) {
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, 1);
}

// glfw: whenever the window size changed (by OS or user resize) this callback
// function executes
// ---------------------------------------------------------------------------------------------
void framebuffer_size_callback(GLFWwindow* window, int newWidth, int newHeight) {
    // make sure the viewport matches the new window dimensions; note that width
    // and height will be significantly larger than specified on retina displays.
    width = newWidth;
    height = newHeight;
}

#define countof(x) (sizeof(x) / sizeof((x)[0]))

GLFWwindow* window;


static JSValue js_resize() {
    glViewport(0, 0, width, height);
    return JS_UNDEFINED;
}

static JSValue js_loadImage(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    const char* filename = JS_ToCString(ctx, argv[0]);
    int width, height, nrChannels;
    unsigned char* data = stbi_load(filename, &width, &height, &nrChannels, 0);
    if (!data) {
        return JS_EXCEPTION;
    }
    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "width", JS_NewInt32(ctx, width));
    JS_SetPropertyStr(ctx, ret, "height", JS_NewInt32(ctx, height));
    JS_SetPropertyStr(ctx, ret, "data", JS_NewArrayBufferCopy(ctx, data, width * height * nrChannels));
    stbi_image_free(data);
    return ret;
}

static JSValue js_createTexture(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int texture;
    glGenTextures(1, &texture);
    return JS_NewInt32(ctx, texture);
}

static JSValue js_bindTexture(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int texture;
    JS_ToUint32(ctx, &texture, argv[0]);
    glBindTexture(GL_TEXTURE_2D, texture);
    return JS_UNDEFINED;
}

static JSValue js_activeTexture(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int texture;
    JS_ToInt32(ctx, &texture, argv[0]);
    glActiveTexture(GL_TEXTURE0 + texture);
    return JS_UNDEFINED;
}

static JSValue js_updateTexture(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int width;
    int height;
    size_t size;
    JSValue data = JS_GetPropertyStr(ctx, argv[0], "data");
    JS_ToInt32(ctx, &width, JS_GetPropertyStr(ctx, argv[0], "width"));
    JS_ToInt32(ctx, &height, JS_GetPropertyStr(ctx, argv[0], "height"));
    unsigned char* pixels = JS_GetArrayBuffer(ctx, &size, data);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);	
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    GLenum format = GL_RGBA;
    if (size == width * height * 3) {
        format = GL_RGB;
    }
    glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, pixels);
    glGenerateMipmap(GL_TEXTURE_2D);
    JS_FreeValue(ctx, data);
    return JS_UNDEFINED;
}

static JSValue js_loadText(JSContext* ctx,
                           JSValueConst this_val,
                           int argc,
                           JSValueConst* argv) {
    const char* filename = JS_ToCString(ctx, argv[0]);
    FILE* file = fopen(filename, "r");
    if (!file) {
        return JS_EXCEPTION;
    }
    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);
    char* buffer = malloc(length + 1);
    fread(buffer, 1, length, file);
    buffer[length] = '\0';
    fclose(file);
    JSValue ret = JS_NewString(ctx, buffer);
    free(buffer);
    return ret;
}
char* concat(const char *s1, const char *s2)
{
    char *result = malloc(strlen(s1) + strlen(s2) + 1); // +1 for the null-terminator
    // in real code you would check for errors in malloc here
    strcpy(result, s1);
    strcat(result, s2);
    return result;
}
const char* GLSL_HEADER = "#version 330 core\n";


float* getNumbers(JSContext* ctx, JSValueConst value) {
    JSValue length = JS_GetPropertyStr(ctx, value, "length");
    uint32_t len = JS_VALUE_GET_INT(length);
    float* numbers = malloc(len * sizeof(float));
    for (uint32_t i = 0; i < len; i++) {
        JSValue element = JS_GetPropertyUint32(ctx, value, i);
        if (JS_IsNumber(element)) {
            double num;
            JS_ToFloat64(ctx, &num, element);
            numbers[i] = num;
        }
        JS_FreeValue(ctx, element);
    }
    return numbers;
}

static JSValue js_uniformMatrix4fv(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int location;
    int transpose;
    const void* value = getNumbers(ctx, argv[2]);
    JS_ToInt32(ctx, &location, argv[0]);
    JS_ToInt32(ctx, &transpose, argv[1]);
    glUniformMatrix4fv(location, 1, transpose, value);
    return JS_UNDEFINED;
}

static JSValue js_uniform1f(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int location;
    double v0;
    JS_ToInt32(ctx, &location, argv[0]);
    JS_ToFloat64(ctx, &v0, argv[1]);
    glUniform1f(location, v0);
    return JS_UNDEFINED;
}

static JSValue js_uniform3f(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int location;
    double v0;
    double v1;
    double v2;
    JS_ToInt32(ctx, &location, argv[0]);
    JS_ToFloat64(ctx, &v0, argv[1]);
    JS_ToFloat64(ctx, &v1, argv[2]);
    JS_ToFloat64(ctx, &v2, argv[3]);
    glUniform3f(location, v0, v1, v2);
    return JS_UNDEFINED;
}

static JSValue js_uniform4f(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int location;
    double v0;
    double v1;
    double v2;
    double v3;
    JS_ToInt32(ctx, &location, argv[0]);
    JS_ToFloat64(ctx, &v0, argv[1]);
    JS_ToFloat64(ctx, &v1, argv[2]);
    JS_ToFloat64(ctx, &v2, argv[3]);
    JS_ToFloat64(ctx, &v3, argv[4]);
    glUniform4f(location, v0, v1, v2, v3);
    return JS_UNDEFINED;
}

static JSValue js_uniform1i(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int location;
    int v0;
    JS_ToInt32(ctx, &location, argv[0]);
    JS_ToInt32(ctx, &v0, argv[1]);
    glUniform1i(location, v0);
    return JS_UNDEFINED;
}

static JSValue js_getUniformLocation(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int program;
    const char* name = JS_ToCString(ctx, argv[1]);
    JS_ToInt32(ctx, &program, argv[0]);
    return JS_NewInt32(ctx, glGetUniformLocation(program, name));
}


static JSValue js_createShaderProgram(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    const char* vertexShaderSource = concat(GLSL_HEADER, JS_ToCString(ctx, argv[0]));
    const char* fragmentShaderSource = concat(GLSL_HEADER, JS_ToCString(ctx, argv[1]));


    // build and compile our shader program
    // ------------------------------------
    // vertex shader
    unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertexShader);
    // check for shader compile errors
    int success;
    char infoLog[512];
    glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
        printf("ERROR::SHADER::VERTEX::COMPILATION_FAILED\n%s\n", infoLog);
    }
    // fragment shader
    unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragmentShader);
    // check for shader compile errors
    glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
        printf("ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n%s\n", infoLog);
    }
    // link shaders
    unsigned int shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);
    // check for linking errors
    glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        printf("ERROR::SHADER::PROGRAM::LINKING_FAILED\n%s\n", infoLog);
    }
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
    return JS_NewInt32(ctx, shaderProgram);
}
static JSValue js_bufferData(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    JSValue buffer = argv[0];
    JSValue bufferLength = JS_GetPropertyStr(ctx, buffer, "length");
    uint32_t length = JS_VALUE_GET_INT(bufferLength);
    float* data = malloc(length * sizeof(float));
    for (uint32_t i = 0; i < length; i++) {
        JSValue element = JS_GetPropertyUint32(ctx, buffer, i);
        if (JS_IsNumber(element)) {
            double num;
            JS_ToFloat64(ctx, &num, element);
            data[i] = num;
        }
        JS_FreeValue(ctx, element);
    }
    glBufferData(GL_ARRAY_BUFFER, length * sizeof(float), data, GL_STATIC_DRAW);
    free(data);
    return JS_UNDEFINED;
}
static JSValue js_bufferDataElement(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    JSValue buffer = argv[0];
    JSValue bufferLength = JS_GetPropertyStr(ctx, buffer, "length");
    uint32_t length = JS_VALUE_GET_INT(bufferLength);
    unsigned int* data = malloc(length * sizeof(unsigned int));
    for (uint32_t i = 0; i < length; i++) {
        JSValue element = JS_GetPropertyUint32(ctx, buffer, i);
        if (JS_IsNumber(element)) {
            unsigned int num;
            JS_ToUint32(ctx, &num, element);
            data[i] = num;
        }
        JS_FreeValue(ctx, element);
    }
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, length * sizeof(unsigned int), data, GL_STATIC_DRAW);
    free(data);
    return JS_UNDEFINED;
}
static JSValue js_createVAO(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int VAO;
    glGenVertexArrays(1, &VAO);
    return JS_NewInt32(ctx, VAO);
}

static JSValue js_createBuffer(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int VBO;
    glGenBuffers(1, &VBO);
    return JS_NewInt32(ctx, VBO);
}

static JSValue js_bindVAO(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int VAO;
    JS_ToUint32(ctx, &VAO, argv[0]);
    glBindVertexArray(VAO);
    return JS_UNDEFINED;
}

static JSValue js_bindVBO(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int VBO;
    JS_ToUint32(ctx, &VBO, argv[0]);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    return JS_UNDEFINED;
}

static JSValue js_bindEBO(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    unsigned int EBO;
    JS_ToUint32(ctx, &EBO, argv[0]);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    return JS_UNDEFINED;
}

static JSValue js_setVertexAttributePointer(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int index;
    int size;
    int normalized;
    int stride;
    int offset;
    JS_ToInt32(ctx, &index, argv[0]);
    JS_ToInt32(ctx, &size, argv[1]);
    JS_ToInt32(ctx, &normalized, argv[2]);
    JS_ToInt32(ctx, &stride, argv[3]);
    JS_ToInt32(ctx, &offset, argv[4]);
    glVertexAttribPointer(index, size, GL_FLOAT, normalized, stride * sizeof(float), (void*)(offset * sizeof(float)));
    return JS_UNDEFINED;
}

static JSValue js_enableVertexAttribute(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int index;
    JS_ToInt32(ctx, &index, argv[0]);
    glEnableVertexAttribArray(index);
    return JS_UNDEFINED;
}

static JSValue js_drawElements(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int count;
    JS_ToInt32(ctx, &count, argv[0]);
    glDrawElements(GL_TRIANGLES, count, GL_UNSIGNED_INT, 0);
    return JS_UNDEFINED;
}

static JSValue js_useProgram(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int program;
    JS_ToInt32(ctx, &program, argv[0]);
    glUseProgram(program);
    return JS_UNDEFINED;
}

static JSValue js_clear(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    glClear(GL_COLOR_BUFFER_BIT);
    return JS_UNDEFINED;
}

static JSValue js_viewport(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int x;
    int y;
    int width;
    int height;
    JS_ToInt32(ctx, &x, argv[0]);
    JS_ToInt32(ctx, &y, argv[1]);
    JS_ToInt32(ctx, &width, argv[2]);
    JS_ToInt32(ctx, &height, argv[3]);
    glViewport(x, y, width, height);
    return JS_UNDEFINED;
}


ma_engine* pEngine;

struct Audio {
    ma_sound* sound;
    const char* filename;
};

#define MAX_AUDIO 4
struct Audio audios[MAX_AUDIO];
int audioCount = 0;

static JSValue js_loadAudio(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    ma_result result;
    if (pEngine == NULL) {
        pEngine = malloc(sizeof(*pEngine));
        result = ma_engine_init(NULL, pEngine);
        if (result != MA_SUCCESS) {
            printf("Failed to initialize audio engine.\n");
            return JS_EXCEPTION;
        }
    }
    if (audioCount >= MAX_AUDIO) {
        printf("Too many audio files loaded.\n");
        return JS_EXCEPTION;
    }
    audios[audioCount].filename = JS_ToCString(ctx, argv[0]);
    audios[audioCount].sound = malloc(sizeof(*(audios[audioCount].sound)));
    result = ma_sound_init_from_file(pEngine, audios[audioCount].filename, 0, NULL, NULL, (audios[audioCount].sound));
    if (result != MA_SUCCESS) {
        printf("Failed to load audio file: %s\n", audios[audioCount].filename);
        return JS_EXCEPTION;
    }
    return JS_NewInt32(ctx, audioCount++);
}

static JSValue js_playAudio(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int index;
    double volume;
    int loop;
    JS_ToInt32(ctx, &index, argv[0]);
    JS_ToFloat64(ctx, &volume, argv[1]);
    JS_ToInt32(ctx, &loop, argv[2]);
    audios[index].sound = malloc(sizeof(*(audios[index].sound)));
    ma_result result;
    result = ma_sound_init_from_file(pEngine, audios[index].filename, 0, NULL, NULL, (audios[index].sound));
    if (result != MA_SUCCESS) {
        printf("Failed to load audio file: %s\n", audios[index].filename);
        return JS_EXCEPTION;
    }
    ma_sound_set_volume(audios[index].sound, volume);
    ma_sound_set_looping(audios[index].sound, loop);
    ma_sound_start(audios[index].sound);
    return JS_UNDEFINED;
}

static JSValue js_stopAudio(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int index;
    JS_ToInt32(ctx, &index, argv[0]);
    ma_sound_stop(audios[index].sound);
    return JS_UNDEFINED;
}


static JSValue js_shouldCloseWindow(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    return JS_NewBool(ctx, glfwWindowShouldClose(window));
}

static JSValue js_swapBuffers(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    glfwSwapBuffers(window);
    return JS_UNDEFINED;
}

static JSValue js_pollEvents(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    glfwPollEvents();
    return JS_UNDEFINED;
}

static JSValue js_getTime(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    return JS_NewFloat64(ctx, glfwGetTime());
}


static JSValue js_initContext(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {

    // glfw: initialize and configure
    // ------------------------------
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // glfw window creation
    // --------------------
    window = glfwCreateWindow(width, height, "Zhuobu", NULL, NULL);
    if (window == NULL)
    {
        printf("Failed to create GLFW window\n");
        glfwTerminate();
        return JS_UNDEFINED;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // glad: load all OpenGL function pointers
    // ---------------------------------------
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        printf("Failed to initialize GLAD\n");
        return JS_UNDEFINED;
    }    
    glfwSwapInterval(1);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    return JS_UNDEFINED;
}
static JSValue js_terminate(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    glfwTerminate();
    exit(EXIT_SUCCESS);
}


static JSValue js_getScreenWidth(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    return JS_NewInt32(ctx, width);
}

static JSValue js_getScreenHeight(JSContext* ctx,
     JSValueConst this_val,
     int argc,
     JSValueConst* argv) {
    return JS_NewInt32(ctx, height);
}
static JSValue js_clearColor(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    double r;
    double g;
    double b;
    double a;
    JS_ToFloat64(ctx, &r, argv[0]);
    JS_ToFloat64(ctx, &g, argv[1]);
    JS_ToFloat64(ctx, &b, argv[2]);
    JS_ToFloat64(ctx, &a, argv[3]);
    glClearColor(r, g, b, a);
    return JS_UNDEFINED;
}


static JSValue js_getKey(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int key;
    JS_ToInt32(ctx, &key, argv[0]);
    return JS_NewBool(ctx, glfwGetKey(window, key) == GLFW_PRESS);
}


static JSValue js_createFramebuffer(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int width;
    int height;
    JS_ToInt32(ctx, &width, argv[0]);
    JS_ToInt32(ctx, &height, argv[1]);
    unsigned int fbo;
    glGenFramebuffers(1, &fbo);
    unsigned int texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, NULL);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glBindFramebuffer(GL_FRAMEBUFFER, fbo);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture, 0);
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "fbo", JS_NewInt32(ctx, fbo));
    JS_SetPropertyStr(ctx, ret, "texture", JS_NewInt32(ctx, texture));
    JS_SetPropertyStr(ctx, ret, "width", JS_NewInt32(ctx, width));
    JS_SetPropertyStr(ctx, ret, "height", JS_NewInt32(ctx, height));
    return ret;
}



static JSValue js_beginFramebuffer(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    int fbo;
    JS_ToInt32(ctx, &fbo, JS_GetPropertyStr(ctx, argv[0], "fbo"));
    int width;
    int height;
    JS_ToInt32(ctx, &width, JS_GetPropertyStr(ctx, argv[0], "width"));
    JS_ToInt32(ctx, &height, JS_GetPropertyStr(ctx, argv[0], "height"));
    glBindFramebuffer(GL_FRAMEBUFFER, fbo);
    glViewport(0, 0, width, height);
    return JS_UNDEFINED;
}

static JSValue js_endFramebuffer(JSContext* ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst* argv) {
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glViewport(0, 0, width, height);
    return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_context_funcs[] = {
    JS_CFUNC_DEF("loadText", 1, js_loadText),
    JS_CFUNC_DEF("createShaderProgram", 2, js_createShaderProgram),
    JS_CFUNC_DEF("bufferData", 3, js_bufferData),
    JS_CFUNC_DEF("bufferDataElement", 3, js_bufferDataElement),
    JS_CFUNC_DEF("createVAO", 0, js_createVAO),
    JS_CFUNC_DEF("createBuffer", 0, js_createBuffer),
    JS_CFUNC_DEF("bindVAO", 1, js_bindVAO),
    JS_CFUNC_DEF("bindVBO", 1, js_bindVBO),
    JS_CFUNC_DEF("bindEBO", 1, js_bindEBO),
    JS_CFUNC_DEF("setVertexAttributePointer", 5, js_setVertexAttributePointer),
    JS_CFUNC_DEF("enableVertexAttribute", 1, js_enableVertexAttribute),
    JS_CFUNC_DEF("drawElements", 4, js_drawElements),
    JS_CFUNC_DEF("uniformMatrix4fv", 4, js_uniformMatrix4fv),
    JS_CFUNC_DEF("uniform1f", 2, js_uniform1f),
    JS_CFUNC_DEF("uniform3f", 4, js_uniform3f),
    JS_CFUNC_DEF("uniform4f", 5, js_uniform4f),
    JS_CFUNC_DEF("uniform1i", 2, js_uniform1i),
    JS_CFUNC_DEF("getUniformLocation", 2, js_getUniformLocation),
    JS_CFUNC_DEF("useProgram", 1, js_useProgram),
    JS_CFUNC_DEF("clear", 0, js_clear),
    JS_CFUNC_DEF("getScreenWidth", 0, js_getScreenWidth),
    JS_CFUNC_DEF("getScreenHeight", 0, js_getScreenHeight),
    JS_CFUNC_DEF("viewport", 4, js_viewport),
    JS_CFUNC_DEF("shouldCloseWindow", 1, js_shouldCloseWindow),
    JS_CFUNC_DEF("swapBuffers", 1, js_swapBuffers),
    JS_CFUNC_DEF("pollEvents", 0, js_pollEvents),
    JS_CFUNC_DEF("getTime", 0, js_getTime),
    JS_CFUNC_DEF("initContext", 0, js_initContext),
    JS_CFUNC_DEF("terminate", 0, js_terminate),
    JS_CFUNC_DEF("clearColor", 4, js_clearColor),
    JS_CFUNC_DEF("loadImage", 1, js_loadImage),
    JS_CFUNC_DEF("createTexture", 0, js_createTexture),
    JS_CFUNC_DEF("bindTexture", 1, js_bindTexture),
    JS_CFUNC_DEF("updateTexture", 2, js_updateTexture),
    JS_CFUNC_DEF("activeTexture", 1, js_activeTexture),
    JS_CFUNC_DEF("resize", 0, js_resize),
    JS_CFUNC_DEF("getKey", 1, js_getKey),
    JS_CFUNC_DEF("createFramebuffer", 2, js_createFramebuffer),
    JS_CFUNC_DEF("beginFramebuffer", 1, js_beginFramebuffer),
    JS_CFUNC_DEF("endFramebuffer", 1, js_endFramebuffer),
    JS_CFUNC_DEF("loadAudio", 1, js_loadAudio),
    JS_CFUNC_DEF("playAudio", 3, js_playAudio),
    JS_CFUNC_DEF("stopAudio", 1, js_stopAudio),
};



static int js_context_init(JSContext* ctx, JSModuleDef* m) {
    return JS_SetModuleExportList(ctx, m, js_context_funcs, countof(js_context_funcs));
}

JSModuleDef* js_init_module(JSContext* ctx, const char* module_name) {
    JSModuleDef* m;
    m = JS_NewCModule(ctx, module_name, js_context_init);
    if (!m)
        return NULL;
    JS_AddModuleExportList(ctx, m, js_context_funcs, countof(js_context_funcs));
    return m;
}
