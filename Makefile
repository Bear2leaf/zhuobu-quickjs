CC = gcc
CFLAGS = -shared
LIBS = -L./quickjs -lquickjs -L./glfw-3.4/build/src -lglfw3 -framework Cocoa -framework IOKit
INCLUDES = -I./glfw-3.4/include -I./glad/include -I./quickjs
SRC = libs/context.c glad/src/glad.c
TARGET = libs/context.so



$(TARGET): $(SRC) quickjs-build glfw-build
	$(CC) -o $(TARGET) $(CFLAGS) $(SRC) $(INCLUDES) $(LIBS)

quickjs-build:
	$(MAKE) -C ./quickjs

glfw-build:
	$(MAKE) -C ./glfw-3.4/build/src

.PHONY: clean
clean:
	rm -f $(TARGET)
	$(MAKE) -C ./quickjs clean
	$(MAKE) -C ./glfw-3.4/build/src clean

.PHONY: run
run: $(TARGET)
	./quickjs/qjs main.js