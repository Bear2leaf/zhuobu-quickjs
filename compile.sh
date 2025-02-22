gcc -o context.so -shared libs/context.c \
 -L./quickjs -lquickjs \
 -DJS_SHARED_LIBRARY \
 -I./glfw-3.4/include -I./glfw-3.4/deps -L./glfw-3.4/build/src -lglfw3 \
 -framework Cocoa -framework OpenGL -framework IOKit