/*
 * An actual two-sided paper surface, using the native editor screenshot as its
 * front texture. A diagonal strip bends around a cylinder; its underside and
 * transparent peeled area come from the same depth-tested, tessellated mesh.
 * The host owns the sheet's layout, perspective, and animation clock.
 */
(() => {
  'use strict';

  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  let requestedProgress = 1;
  let renderer = null;
  let destroyed = false;

  const api = {
    ready,
    render(progress) {
      const value = Number(progress);
      if (Number.isFinite(value)) requestedProgress = Math.max(0, Math.min(2.2, value));
      if (renderer && !destroyed) renderer.draw(requestedProgress);
    },
    destroy() {
      destroyed = true;
      if (renderer) renderer.destroy();
      renderer = null;
      resolveReady({ renderer: 'fallback' });
    }
  };
  window.XShotPaper = api;

  const vertexSource = `
    precision highp float;
    attribute vec2 a_uv;
    uniform float u_aspect;
    uniform vec2 u_normal;
    uniform float u_crease;
    uniform float u_radius;
    varying vec2 v_uv;
    varying vec3 v_normal;
    varying float v_angle;
    varying float v_distance;

    void main() {
      vec2 point = vec2(a_uv.x * u_aspect, a_uv.y);
      float distance = dot(point, u_normal) - u_crease;
      float angle = max(distance, 0.0) / u_radius;
      float height = u_radius * (1.0 - cos(angle));
      vec2 bent = point;
      if (distance > 0.0) {
        bent += u_normal * (u_radius * sin(angle) - distance);
      }
      // The host already positions the whole sheet. Only the paper itself
      // rises toward the camera here, without another perspective transform.
      gl_Position = vec4(bent.x / u_aspect * 2.0 - 1.0,
                         bent.y * 2.0 - 1.0, -height * 2.0, 1.0);
      v_uv = a_uv;
      v_normal = vec3(-u_normal * sin(angle), cos(angle));
      v_angle = angle;
      v_distance = distance;
    }
  `;

  const fragmentSource = `
    precision highp float;
    uniform sampler2D u_image;
    uniform float u_aspect;
    uniform float u_antialias;
    varying vec2 v_uv;
    varying vec3 v_normal;
    varying float v_angle;
    varying float v_distance;

    void main() {
      // This mask follows material coordinates, so even the rounded corner
      // really bends with the paper instead of clipping the canvas rectangle.
      vec2 size = vec2(u_aspect, 1.0);
      float radius = 0.010;
      vec2 q = abs(v_uv * size - size * 0.5) - (size * 0.5 - radius);
      float edge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
      float alpha = 1.0 - smoothstep(-u_antialias, u_antialias, edge);
      if (alpha < 0.005) discard;

      vec3 normal = normalize(v_normal);
      vec3 color;
      if (gl_FrontFacing) {
        color = texture2D(u_image, v_uv).rgb;
        float shade = 1.0 - 0.18 * (1.0 - max(normal.z, 0.0));
        // A narrow contact shadow joins the flat screenshot to the roll.
        float contact = exp(-pow(v_distance / 0.020, 2.0));
        shade *= 1.0 - 0.12 * contact;
        color *= shade;
        float sheen = pow(max(dot(normal, normalize(vec3(-0.28, 0.42, 1.0))), 0.0), 28.0);
        color += vec3(0.022) * sheen * smoothstep(0.12, 0.85, v_angle);
      } else {
        // A neutral white reverse, lit by the cylinder's analytic normal.
        normal = -normal;
        vec3 light = normalize(vec3(-0.28, 0.44, 1.0));
        float diffuse = max(dot(normal, light), 0.0);
        float shade = 0.73 + 0.27 * diffuse;
        float sheen = pow(max(dot(normal, normalize(vec3(-0.12, 0.20, 1.0))), 0.0), 22.0);
        color = vec3(0.982, 0.988, 1.0) * shade + vec3(0.045) * sheen;
        // A very fine paper edge, independent of screenshot content.
        float rim = 1.0 - smoothstep(0.0004, 0.0027, -edge);
        color = mix(color, vec3(0.79, 0.82, 0.88), rim * 0.28);
      }
      gl_FragColor = vec4(color, alpha);
    }
  `;

  function initialize() {
    const canvas = document.getElementById('paper-canvas');
    const image = document.getElementById('hero-image');
    if (!canvas || !image || destroyed) {
      resolveReady({ renderer: 'fallback' });
      return;
    }
    const parent = canvas.parentElement;
    let gl;
    let program;
    let vertexBuffer;
    let indexBuffer;
    let texture;
    let observer;
    let imageVersion = 0;
    let hasTexture = false;
    let renderCount = 0;
    let settled = false;
    const shaders = [];

    function settle(mode) {
      if (!settled) {
        settled = true;
        resolveReady({ renderer: mode });
      }
    }

    function fallback() {
      hasTexture = false;
      canvas.classList.remove('is-ready');
      canvas.dataset.renderer = 'fallback';
      if (parent) {
        parent.classList.remove('has-curl');
        parent.dataset.renderer = 'fallback';
      }
      settle('fallback');
    }

    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to create paper shader.');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Unable to compile paper shader.');
      }
      return shader;
    }

    function dispose() {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', resize);
      image.removeEventListener('load', loadTexture);
      image.removeEventListener('error', fallback);
      canvas.removeEventListener('webglcontextlost', contextLost);
      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
        if (indexBuffer) gl.deleteBuffer(indexBuffer);
        if (program) gl.deleteProgram(program);
        shaders.forEach(shader => gl.deleteShader(shader));
      }
      canvas.classList.remove('is-ready');
      if (parent) parent.classList.remove('has-curl');
    }

    function contextLost(event) {
      event.preventDefault();
      fallback();
    }

    let locations;
    let indexCount = 0;

    function resize() {
      if (renderer && !destroyed) renderer.draw(requestedProgress);
    }

    function draw(progress) {
      if (!hasTexture || destroyed || gl.isContextLost()) return;
      const cssWidth = canvas.clientWidth || image.clientWidth;
      const cssHeight = canvas.clientHeight || image.clientHeight;
      if (!cssWidth || !cssHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      const scale = Math.min(dpr, maxSize / cssWidth, maxSize / cssHeight);
      const width = Math.max(1, Math.round(cssWidth * scale));
      const height = Math.max(1, Math.round(cssHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      const aspect = image.naturalWidth / image.naturalHeight;
      const intro = Math.min(progress, 1);
      const eased = intro * intro * (3 - 2 * intro);
      const peel = Math.max(0, (progress - 1) / 1.2);
      const extended = peel * peel * (3 - 2 * peel);
      // At rest, the crease reaches 35.8% across the bottom and 40.8% up
      // the right edge. A direct peel continues along the same cylinder,
      // reaching 90% and 94% at 2.2 without changing the settled silhouette.
      const reachX = aspect * (0.008 + 0.350 * eased + 0.542 * extended);
      const reachY = 0.008 + 0.400 * eased + 0.532 * extended;
      const length = Math.hypot(reachX, reachY);
      const normalX = reachY / length;
      const normalY = -reachX / length;
      const cornerDistance = reachX * normalX;
      gl.uniform1f(locations.aspect, aspect);
      gl.uniform2f(locations.normal, normalX, normalY);
      gl.uniform1f(locations.crease, (aspect - reachX) * normalX);
      // Slightly beyond a half turn produces a lifted, visibly white reverse
      // with a smoothly rolled ridge, rather than a flat reflected triangle.
      // The tallest point is 2 * radius. With the shader's -2 depth scale,
      // this ceiling keeps the entire roll inside the near plane (z >= -0.98).
      // It is inactive for the original 0…1 animation and this screenshot's
      // complete peel, but also bounds depth for unusually wide textures.
      gl.uniform1f(locations.radius, Math.min(cornerDistance / 3.38, 0.245));
      gl.uniform1f(locations.antialias, 0.65 / height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(locations.image, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(locations.uv);
      gl.vertexAttribPointer(locations.uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
      canvas.dataset.progress = progress.toFixed(4);
      canvas.dataset.curlAmount = (eased + extended).toFixed(4);
      canvas.dataset.renderCount = String(++renderCount);
      canvas.dataset.renderer = 'webgl';
      canvas.classList.add('is-ready');
      if (parent) {
        parent.dataset.renderer = 'webgl';
        parent.classList.add('has-curl');
      }
      settle('webgl');
    }

    async function loadTexture() {
      const version = ++imageVersion;
      try {
        if (image.decode) await image.decode();
        if (destroyed || version !== imageVersion || !image.naturalWidth || gl.isContextLost()) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        let source = image;
        if (Math.max(image.naturalWidth, image.naturalHeight) > maxTextureSize) {
          const reduced = document.createElement('canvas');
          const ratio = maxTextureSize / Math.max(image.naturalWidth, image.naturalHeight);
          reduced.width = Math.round(image.naturalWidth * ratio);
          reduced.height = Math.round(image.naturalHeight * ratio);
          const context = reduced.getContext('2d');
          if (!context) throw new Error('Unable to resize paper texture.');
          context.drawImage(image, 0, 0, reduced.width, reduced.height);
          source = reduced;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('Unable to upload paper texture.');
        hasTexture = true;
        draw(requestedProgress);
      } catch (_) {
        if (version === imageVersion && !destroyed) fallback();
      }
    }

    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        depth: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      });
      if (!gl) throw new Error('WebGL is unavailable.');
      program = gl.createProgram();
      if (!program) throw new Error('Unable to create paper program.');
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Unable to link paper program.');
      }
      locations = {
        uv: gl.getAttribLocation(program, 'a_uv'),
        aspect: gl.getUniformLocation(program, 'u_aspect'),
        normal: gl.getUniformLocation(program, 'u_normal'),
        crease: gl.getUniformLocation(program, 'u_crease'),
        radius: gl.getUniformLocation(program, 'u_radius'),
        antialias: gl.getUniformLocation(program, 'u_antialias'),
        image: gl.getUniformLocation(program, 'u_image')
      };
      // 38,025 vertices remain within WebGL 1's portable 16-bit index range.
      // The density also makes the rolled silhouette smooth at a 2x DPR.
      const columns = 224;
      const rows = 168;
      const vertices = new Float32Array((columns + 1) * (rows + 1) * 2);
      const indices = new Uint16Array(columns * rows * 6);
      let vertex = 0;
      for (let row = 0; row <= rows; row++) {
        for (let column = 0; column <= columns; column++) {
          vertices[vertex++] = column / columns;
          vertices[vertex++] = row / rows;
        }
      }
      let index = 0;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const bottomLeft = row * (columns + 1) + column;
          const topLeft = bottomLeft + columns + 1;
          indices[index++] = bottomLeft;
          indices[index++] = bottomLeft + 1;
          indices[index++] = topLeft;
          indices[index++] = bottomLeft + 1;
          indices[index++] = topLeft + 1;
          indices[index++] = topLeft;
        }
      }
      indexCount = indices.length;
      vertexBuffer = gl.createBuffer();
      indexBuffer = gl.createBuffer();
      texture = gl.createTexture();
      if (!vertexBuffer || !indexBuffer || !texture) throw new Error('Unable to allocate paper surface.');
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      renderer = { draw, destroy: dispose };
      image.addEventListener('load', loadTexture);
      image.addEventListener('error', fallback);
      canvas.addEventListener('webglcontextlost', contextLost);
      window.addEventListener('resize', resize, { passive: true });
      if (window.ResizeObserver) {
        observer = new ResizeObserver(resize);
        observer.observe(canvas);
      }
      if (image.complete) {
        if (image.naturalWidth) loadTexture();
        else fallback();
      }
    } catch (_) {
      dispose();
      fallback();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
