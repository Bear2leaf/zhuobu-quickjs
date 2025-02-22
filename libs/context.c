#include "quickjs/quickjs.h"
/*****************************************************************************
 * Title:   GLBoing
 * Desc:    Tribute to Amiga Boing.
 * Author:  Jim Brooks  <gfx@jimbrooks.org>
 *          Original Amiga authors were R.J. Mical and Dale Luck.
 *          GLFW conversion by Marcus Geelnard
 * Notes:   - 360' = 2*PI [radian]
 *
 *          - Distances between objects are created by doing a relative
 *            Z translations.
 *
 *          - Although OpenGL enticingly supports alpha-blending,
 *            the shadow of the original Boing didn't affect the color
 *            of the grid.
 *
 *          - [Marcus] Changed timing scheme from interval driven to frame-
 *            time based animation steps (which results in much smoother
 *            movement)
 *
 * History of Amiga Boing:
 *
 * Boing was demonstrated on the prototype Amiga (codenamed "Lorraine") in
 * 1985. According to legend, it was written ad-hoc in one night by
 * R. J. Mical and Dale Luck. Because the bouncing ball animation was so fast
 * and smooth, attendees did not believe the Amiga prototype was really doing
 * the rendering. Suspecting a trick, they began looking around the booth for
 * a hidden computer or VCR.
 *****************************************************************************/

 #if defined(_MSC_VER)
 // Make MS math.h define M_PI
 #define _USE_MATH_DEFINES
#endif

#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define GLAD_GL_IMPLEMENTATION
#include <glad/gl.h>
#define GLFW_INCLUDE_NONE
#include <GLFW/glfw3.h>

#include <linmath.h>


/*****************************************************************************
 * Various declarations and macros
 *****************************************************************************/

/* Prototypes */
void init( void );
void reshape( GLFWwindow* window, int w, int h );
void key_callback( GLFWwindow* window, int key, int scancode, int action, int mods );

/* Global vars */
int windowed_xpos, windowed_ypos, windowed_width, windowed_height;
int width, height;



void key_callback( GLFWwindow* window, int key, int scancode, int action, int mods )
{
    if (action != GLFW_PRESS)
        return;

    if (key == GLFW_KEY_ESCAPE && mods == 0)
        glfwSetWindowShouldClose(window, GLFW_TRUE);
    if ((key == GLFW_KEY_ENTER && mods == GLFW_MOD_ALT) ||
        (key == GLFW_KEY_F11 && mods == GLFW_MOD_ALT))
    {
        if (glfwGetWindowMonitor(window))
        {
            glfwSetWindowMonitor(window, NULL,
                                 windowed_xpos, windowed_ypos,
                                 windowed_width, windowed_height, 0);
        }
        else
        {
            GLFWmonitor* monitor = glfwGetPrimaryMonitor();
            if (monitor)
            {
                const GLFWvidmode* mode = glfwGetVideoMode(monitor);
                glfwGetWindowPos(window, &windowed_xpos, &windowed_ypos);
                glfwGetWindowSize(window, &windowed_width, &windowed_height);
                glfwSetWindowMonitor(window, monitor, 0, 0, mode->width, mode->height, mode->refreshRate);
            }
        }
    }
}




#define countof(x) (sizeof(x) / sizeof((x)[0]))

GLFWwindow* window;

static JSValue js_initContext(JSContext *ctx, JSValueConst this_val,
    int argc, JSValueConst *argv)
{

    /* Init GLFW */
    if( !glfwInit() )
        exit( EXIT_FAILURE );

    window = glfwCreateWindow( 400, 400, "Zhuobu", NULL, NULL );
    if (!window)
    {
        glfwTerminate();
        exit( EXIT_FAILURE );
    }

    glfwSetWindowAspectRatio(window, 1, 1);

    glfwSetKeyCallback(window, key_callback);

    glfwMakeContextCurrent(window);
    gladLoadGL(glfwGetProcAddress);
    glfwSwapInterval( 1 );

    glfwGetFramebufferSize(window, &width, &height);

    glfwSetTime( 0.0 );
    return JS_UNDEFINED;
}
static JSValue js_uninitContext(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{

   glfwTerminate();
   exit( EXIT_SUCCESS );
}

static JSValue js_now(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
    return JS_NewFloat64(ctx, glfwGetTime() * 1000);
}

static JSValue js_beginFrame(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
   glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
   // init projection matrix
   glMatrixMode(GL_PROJECTION);
   glLoadIdentity();
   glOrtho(0, width, height, 0, -1, 1);
   glMatrixMode(GL_MODELVIEW);
   glLoadIdentity();

   return JS_UNDEFINED;
}
static JSValue js_pollEvents(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
   glfwPollEvents();
   return JS_UNDEFINED;
}
static JSValue js_endFrame(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
   /* Swap buffers */
   glfwSwapBuffers(window);
   return JS_UNDEFINED;
}

static JSValue js_shouldClose(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
    return JS_NewBool(ctx, glfwWindowShouldClose(window));
}

static JSValue js_setClearColor(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
    double r, g, b, a;
    if (JS_ToFloat64(ctx, &r, argv[0]))
        return JS_EXCEPTION;
    if (JS_ToFloat64(ctx, &g, argv[1]))
        return JS_EXCEPTION;
    if (JS_ToFloat64(ctx, &b, argv[2]))
        return JS_EXCEPTION;
    if (JS_ToFloat64(ctx, &a, argv[3]))
        return JS_EXCEPTION;
    glClearColor(r, g, b, a);
    return JS_UNDEFINED;
}

double* readNumbers(JSContext *ctx, JSValueConst array) {
    JSValue length_val = JS_GetPropertyStr(ctx, array, "length");
    uint32_t len = JS_VALUE_GET_INT(length_val);
    double* numbers = malloc(len * sizeof(double));
    for (uint32_t i = 0; i < len; i++) {
        JSValue element = JS_GetPropertyUint32(ctx, array, i);
        if (JS_IsNumber(element)) {
            double num;
            JS_ToFloat64(ctx, &num, element);
            numbers[i] = num;
        }
        JS_FreeValue(ctx, element);
    }
    return numbers;
}

static JSValue js_drawSquare(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
   double rotation;
   double* position = readNumbers(ctx, argv[0]);
   JS_ToFloat64(ctx, &rotation, argv[1]);
   double* scale = readNumbers(ctx, argv[2]);
   double* color = readNumbers(ctx, argv[3]);
   // now we draw the square
   glPushMatrix();
   glTranslatef(position[0], position[1], position[2]);
   glRotatef(rotation * (180.0 / M_PI), 0.0, 0.0, 1.0);
   glScalef(scale[0], scale[1], scale[2]);
   glBegin(GL_QUADS);
   glColor4f(color[0], color[1], color[2], color[3]);
   glVertex3f(0, 0, 0.0f);
   glVertex3f(8, 0, 0.0f);
   glVertex3f(8, 8, 0.0f);
   glVertex3f(0, 8, 0.0f);
   glEnd();
   glPopMatrix();
   return JS_UNDEFINED;
}
static JSValue js_getScreenWidth(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
    return JS_NewInt32(ctx, width);
}

static JSValue js_getScreenHeight(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
    return JS_NewInt32(ctx, height);
}


static const JSCFunctionListEntry js_context_funcs[] = {
    JS_CFUNC_DEF("initContext", 1, js_initContext),
    JS_CFUNC_DEF("uninitContext", 1, js_uninitContext),
    JS_CFUNC_DEF("shouldClose", 0, js_shouldClose),
    JS_CFUNC_DEF("setClearColor", 1, js_setClearColor),
    JS_CFUNC_DEF("beginFrame", 0, js_beginFrame),
    JS_CFUNC_DEF("endFrame", 0, js_endFrame),
    JS_CFUNC_DEF("drawSquare", 0, js_drawSquare),
    JS_CFUNC_DEF("now", 0, js_now),
    JS_CFUNC_DEF("getScreenWidth", 0, js_getScreenWidth),
    JS_CFUNC_DEF("getScreenHeight", 0, js_getScreenHeight),
    JS_CFUNC_DEF("pollEvents", 0, js_pollEvents),
};

static int js_context_init(JSContext *ctx, JSModuleDef *m)
{
    return JS_SetModuleExportList(ctx, m, js_context_funcs,
                                  countof(js_context_funcs));
}

#ifdef JS_SHARED_LIBRARY
#define JS_INIT_MODULE js_init_module
#else
#define JS_INIT_MODULE js_init_module_fib
#endif

JSModuleDef *JS_INIT_MODULE(JSContext *ctx, const char *module_name)
{
    JSModuleDef *m;
    m = JS_NewCModule(ctx, module_name, js_context_init);
    if (!m)
        return NULL;
    JS_AddModuleExportList(ctx, m, js_context_funcs, countof(js_context_funcs));
    return m;
}
