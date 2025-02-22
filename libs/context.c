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

#define RADIUS           70.f
#define STEP_LONGITUDE   22.5f                   /* 22.5 makes 8 bands like original Boing */
#define STEP_LATITUDE    22.5f

#define DIST_BALL       (RADIUS * 2.f + RADIUS * 0.1f)

#define VIEW_SCENE_DIST (DIST_BALL * 3.f + 200.f)/* distance from viewer to middle of boing area */
#define GRID_SIZE       (RADIUS * 4.5f)          /* length (width) of grid */
#define BOUNCE_HEIGHT   (RADIUS * 2.1f)
#define BOUNCE_WIDTH    (RADIUS * 2.1f)

#define SHADOW_OFFSET_X -20.f
#define SHADOW_OFFSET_Y  10.f
#define SHADOW_OFFSET_Z   0.f

#define WALL_L_OFFSET   0.f
#define WALL_R_OFFSET   5.f

/* Animation speed (50.0 mimics the original GLUT demo speed) */
#define ANIMATION_SPEED 50.f

/* Maximum allowed delta time per physics iteration */
#define MAX_DELTA_T 0.02f

/* Draw ball, or its shadow */
typedef enum { DRAW_BALL, DRAW_BALL_SHADOW } DRAW_BALL_ENUM;

/* Vertex type */
typedef struct {float x; float y; float z;} vertex_t;

/* Global vars */
int windowed_xpos, windowed_ypos, windowed_width, windowed_height;
int width, height;
GLfloat deg_rot_y       = 0.f;
GLfloat deg_rot_y_inc   = 2.f;
int override_pos        = GLFW_FALSE;
GLfloat cursor_x        = 0.f;
GLfloat cursor_y        = 0.f;
GLfloat ball_x          = -RADIUS;
GLfloat ball_y          = -RADIUS;
GLfloat ball_x_inc      = 1.f;
GLfloat ball_y_inc      = 2.f;
DRAW_BALL_ENUM drawBallHow;
double  t;
double  t_old = 0.f;
double  dt;

/* Random number generator */
#ifndef RAND_MAX
 #define RAND_MAX 4095
#endif


/*****************************************************************************
 * Truncate a degree.
 *****************************************************************************/
GLfloat TruncateDeg( GLfloat deg )
{
   if ( deg >= 360.f )
      return (deg - 360.f);
   else
      return deg;
}

/*****************************************************************************
 * Convert a degree (360-based) into a radian.
 * 360' = 2 * PI
 *****************************************************************************/
double deg2rad( double deg )
{
   return deg / 360 * (2 * M_PI);
}

/*****************************************************************************
 * 360' sin().
 *****************************************************************************/
double sin_deg( double deg )
{
   return sin( deg2rad( deg ) );
}

/*****************************************************************************
 * 360' cos().
 *****************************************************************************/
double cos_deg( double deg )
{
   return cos( deg2rad( deg ) );
}

/*****************************************************************************
 * Compute a cross product (for a normal vector).
 *
 * c = a x b
 *****************************************************************************/
void CrossProduct( vertex_t a, vertex_t b, vertex_t c, vertex_t *n )
{
   GLfloat u1, u2, u3;
   GLfloat v1, v2, v3;

   u1 = b.x - a.x;
   u2 = b.y - a.y;
   u3 = b.y - a.z;

   v1 = c.x - a.x;
   v2 = c.y - a.y;
   v3 = c.z - a.z;

   n->x = u2 * v3 - v2 * u3;
   n->y = u3 * v1 - v3 * u1;
   n->z = u1 * v2 - v1 * u2;
}


#define BOING_DEBUG 0



/*****************************************************************************
 * reshape()
 *****************************************************************************/
 void reshape( GLFWwindow* window, int w, int h )
 {
    mat4x4 projection, view;
 
    glViewport( 0, 0, (GLsizei)w, (GLsizei)h );
 
    glMatrixMode( GL_PROJECTION );
    mat4x4_perspective( projection,
                        2.f * (float) atan2( RADIUS, 200.f ),
                        (float)w / (float)h,
                        1.f, VIEW_SCENE_DIST );
    glLoadMatrixf((const GLfloat*) projection);
 
    glMatrixMode( GL_MODELVIEW );
    {
       vec3 eye = { 0.f, 0.f, VIEW_SCENE_DIST };
       vec3 center = { 0.f, 0.f, 0.f };
       vec3 up = { 0.f, -1.f, 0.f };
       mat4x4_look_at( view, eye, center, up );
    }
    glLoadMatrixf((const GLfloat*) view);
 }
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

    glfwSetFramebufferSizeCallback(window, reshape);
    glfwSetKeyCallback(window, key_callback);

    glfwMakeContextCurrent(window);
    gladLoadGL(glfwGetProcAddress);
    glfwSwapInterval( 1 );

    glfwGetFramebufferSize(window, &width, &height);
    reshape(window, width, height);

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
    return JS_NewFloat64(ctx, t * 1000);
}

static JSValue js_beginFrame(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
   /* Timing */
   t = glfwGetTime();
   dt = t - t_old;
   t_old = t;
   glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
   // init projection matrix
   glMatrixMode(GL_PROJECTION);
   glLoadIdentity();
   glOrtho(0, width, height, 0, -1, 1);
   glMatrixMode(GL_MODELVIEW);
   glLoadIdentity();

   return JS_UNDEFINED;
}
static JSValue js_endFrame(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv)
{
   glFlush();
   /* Swap buffers */
   glfwSwapBuffers(window);
   glfwPollEvents();
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
