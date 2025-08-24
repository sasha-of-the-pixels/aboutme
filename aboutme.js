const d = new Date();

// setting up WebGL for the canvas
// lots of stuff here adapted from the "WebGL2 Fundamentals" website
// like the basic setup of how to get stuff drawn to the screen
// but the shader itself is mine, I changed the setup
// to use the uniforms that I want it to, and so on

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

var vertexShaderSource = `#version 300 es
    in vec4 a_position;

    void main() {
    gl_Position = a_position;
    }
    `;

var fragmentShaderSource = `#version 300 es
    precision highp float;

    float d(vec3 tri_uv, float isoval) {
        return step(-(abs(tri_uv.x) + abs(tri_uv.y) + abs(tri_uv.z)), -isoval);
    }

    const float pi = 3.1415926536;
    const float scale = 170.;
    uniform float uTime;
    out vec4 fragColor;

    void main() {
        // Normalized pixel coordinates (from 0 to 1)
        vec2 uv = gl_FragCoord.xy / scale;
        float hyp = uv.x / 2. + sqrt(3.) / 2. * uv.y;
        vec3 tri_uv = vec3(uv.x, hyp, hyp - uv.x);
        const float isoval = 0.8333;

        vec3 hWiggle1 = vec3(0., 0.1, 0.1) * sin(2. * uTime);
        vec3 hWiggle2 = vec3(0., 0.1, 0.1) * sin(2. * uTime + 2. * pi / 3.);
        vec3 hWiggle3 = vec3(0., 0.1, 0.1) * sin(2. * uTime + 4. * pi / 3.);

        vec3 f1 = fract(
                tri_uv - 0.3 * vec3(uTime, 2. * uTime, uTime) + hWiggle1
            ) - .5;
        vec3 f1Fixed = fract(
                tri_uv - 0.3 * vec3(uTime, 2. * uTime, uTime) + vec3(0., .1, .1)
            ) - .5;

        vec3 f2 = fract(
                tri_uv +
                    vec3(.3333, 0.6666, 0.3333) -
                    0.3 * vec3(uTime, 2. * uTime, uTime) +
                    hWiggle2
            ) - .5;
        vec3 f2Fixed = fract(
                tri_uv +
                    vec3(.3333, 0.6666, 0.3333) -
                    0.3 * vec3(uTime, 2. * uTime, uTime) +
                    vec3(0., .1, .1)
            ) - .5;

        vec3 f3 = fract(
                tri_uv +
                    vec3(.6666, 1.3333, 0.6666) -
                    0.3 * vec3(uTime, 2. * uTime, uTime) +
                    hWiggle3
            ) - .5;
        vec3 f3Fixed = fract(
                tri_uv +
                    vec3(.6666, 1.3333, 0.6666) -
                    0.3 * vec3(uTime, 2. * uTime, uTime) +
                    vec3(0., .1, .1)
            ) - .5;

        float d1 = d(f1, isoval);
        float d2 = d(f2, isoval);
        float d3 = d(f3, isoval);
        float d1f = d(f1Fixed, isoval);
        float d2f = d(f2Fixed, isoval);
        float d3f = d(f3Fixed, isoval);
        float d_edge =
            d(f1, 0.8) -
                d(f1, 0.9) +
                d(f2, 0.8 + 0.02 * cos(2. * uTime)) -
                d(f2, 0.9) +
                d(f3, 0.8) -
                d(f3, 0.9);

        // Output to screen
        fragColor = vec4(d_edge, d2, d3, 0.);
        float bright1 = hWiggle2.y <= hWiggle1.y
                && d2 > 0. ? 0. : (hWiggle3.y <= hWiggle1.y ? (d3 > 0. ? 0. : d1) : d1);
        float bright2 = hWiggle3.y <= hWiggle2.y
                && d3 > 0. ? 0. : (
            hWiggle1.y <= hWiggle2.y
            ? (d1 > 0. ? 0. : d2) : d2
            );
        float bright3 = hWiggle1.y <= hWiggle3.y
                && d1 > 0. ? 0. : (
            hWiggle2.y <= hWiggle3.y
            ? (d2 > 0. ? 0. : d3) : d3
            );
        float dark1 = d2 > 0. ? 0. : (d3 > 0. ? 0. : d1f);
        float dark2 = d3 > 0. ? 0. : (d1 > 0. ? 0. : d2f);
        float dark3 = d1 > 0. ? 0. : (d2 > 0. ? 0. : d3f);

        if (bright1 > 0.) {
            fragColor = vec4(190., 245., 230., 255) / 255.;
        } else if (bright2 > 0.) {
            fragColor = vec4(215., 245., 210., 255) / 255.;
        } else if (bright3 > 0.) {
            fragColor = vec4(194., 232., 245., 255) / 255.;
        } else if (dark1 > 0.) {
            fragColor = vec4(165., 231., 215., 255) / 255.;
        } else if (dark2 > 0.) {
            fragColor = vec4(190., 240., 190., 255) / 255.;
        } else {
            fragColor = vec4(170., 225., 240., 255) / 255.;
        }
    }
`;

bg = document.getElementById("bg");
console.log(bg);
var gl = bg.getContext("webgl2");

prev_time = 0;
animToggle = document.getElementsByTagName("input")[0];
var animateBg = false;
animToggle.addEventListener("change", () => {
    animateBg = !animateBg;
    console.log("animateBg =", animateBg);
});

if (!gl) {
    // TODO: static bg image instead
} else {
    var fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
    );
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    var program = createProgram(gl, vertexShader, fragmentShader);

    // attribute / uniform locations
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var timeUniformLocation = gl.getUniformLocation(program, "uTime");

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // six 2d points
    var positions = [-1, -1, 1, 1, 1, -1, -1, -1, 1, 1, -1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);

    // vao setup
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation,
        size,
        type,
        normalize,
        stride,
        offset,
    );

    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    onresize = () => {
        gl.canvas.width = window.innerWidth;
        gl.canvas.height = window.innerHeight;
    };
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    function render(t) {
        // t *= 0.001; // convert to seconds
        if (animateBg) {
            prev_time += 0.01;
        }
        // t = prev_time;

        console.log("t =", t, "prev_time =", prev_time);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // set uniforms
        gl.uniform1f(timeUniformLocation, prev_time);

        // Bind the attribute/buffer set we want.
        gl.bindVertexArray(vao);
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);

        requestAnimationFrame(render);
    }
    render(0);
}
