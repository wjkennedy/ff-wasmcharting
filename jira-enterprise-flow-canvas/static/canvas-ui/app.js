const COLORS = {
  backlog: [0.298, 0.604, 1.0],
  inProgress: [0.212, 0.702, 0.494],
  done: [1.0, 0.337, 0.188],
  other: [0.396, 0.329, 0.753]
};

const $ = (id) => document.getElementById(id);

class FlowChartWebGL {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!this.gl) throw new Error('WebGL not available');
    this.program = this.buildProgram();
    this.positionBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
    this.rects = [];
    this.labels = [];
    this.onBarClick = null;
    this.installEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  buildProgram() {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, `
      attribute vec2 aPosition;
      attribute vec3 aColor;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
  }

  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (this.lastData) this.render(this.lastData);
  }

  installEvents() {
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = this.rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      if (!hit) {
        this.tooltip.style.display = 'none';
        this.canvas.style.cursor = 'default';
        return;
      }
      this.canvas.style.cursor = 'pointer';
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${y}px`;
      this.tooltip.textContent = `${hit.label}: ${hit.value}`;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
      this.canvas.style.cursor = 'default';
    });

    this.canvas.addEventListener('click', (event) => {
      if (!this.onBarClick) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = this.rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      if (hit) this.onBarClick(hit.bucketKey);
    });
  }

  render(data) {
    this.lastData = data;
    const gl = this.gl;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const labels = [
      ['backlog', data.buckets.backlog || 0],
      ['inProgress', data.buckets.inProgress || 0],
      ['done', data.buckets.done || 0],
      ['other', data.buckets.other || 0]
    ];
    this.labels = labels;

    const max = Math.max(1, ...labels.map(([, v]) => v));
    const margin = { top: 18, right: 20, bottom: 26, left: 20 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;
    const gap = 18;
    const barW = (chartW - gap * (labels.length - 1)) / labels.length;

    const vertices = [];
    const colors = [];
    this.rects = [];

    labels.forEach(([key, value], index) => {
      const x = margin.left + index * (barW + gap);
      const h = (value / max) * chartH;
      const y = margin.top + (chartH - h);
      this.rects.push({
        x,
        y,
        w: barW,
        h,
        value,
        label: key,
        bucketKey: key
      });
      this.pushRect(vertices, x, y, barW, h, width, height);
      const color = COLORS[key] || COLORS.other;
      for (let i = 0; i < 6; i += 1) {
        colors.push(color[0], color[1], color[2]);
      }
    });

    gl.clearColor(1, 1, 1, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    const posLoc = gl.getAttribLocation(this.program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const colorLoc = gl.getAttribLocation(this.program, 'aColor');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }

  pushRect(vertices, x, y, w, h, width, height) {
    const toNdc = (px, py) => {
      const ndcX = (px / width) * 2 - 1;
      const ndcY = 1 - (py / height) * 2;
      return [ndcX, ndcY];
    };
    const [x1, y1] = toNdc(x, y);
    const [x2, y2] = toNdc(x + w, y + h);
    vertices.push(
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2
    );
  }
}

function getStatusClause(bucketKey, statusGroups) {
  const list = statusGroups?.[bucketKey] || [];
  if (!Array.isArray(list) || list.length === 0) return '';
  return `status in (${list.map((s) => `"${String(s).replaceAll('"', '\\"')}"`).join(', ')})`;
}

function renderIssueRows(issues) {
  const body = $('issuesTableBody');
  body.innerHTML = '';
  for (const issue of issues) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(issue.key || '')}</td>
      <td>${escapeHtml(issue.summary || '')}</td>
      <td>${escapeHtml(issue.status || '')}</td>
      <td>${escapeHtml(issue.priority || '')}</td>
    `;
    body.appendChild(row);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function downloadCsv(fileName, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function createBridgeClient() {
  if (window.__bridge && typeof window.__bridge.callBridge === 'function') {
    return {
      invoke: async (functionKey, payload) =>
        window.__bridge.callBridge('invoke', { functionKey, payload }),
      mode: 'forge'
    };
  }
  throw new Error('Forge bridge is unavailable in this context');
}

async function waitForBridge(timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.__bridge && typeof window.__bridge.callBridge === 'function') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Forge bridge is unavailable in this context');
}

async function main() {
  const status = $('statusText');
  const jqlInput = $('jqlInput');
  const errorBanner = $('errorBanner');
  const chart = new FlowChartWebGL($('chart'), $('tooltip'));
  let statusGroups = {};
  let projectKey = '';
  let client;
  try {
    await waitForBridge();
    client = createBridgeClient();
    const bootstrap = await client.invoke('getBootstrap');
    statusGroups = bootstrap?.config?.statusGroups || {};
    projectKey = bootstrap?.viewer?.projectKey || '';
  } catch (error) {
    errorBanner.hidden = false;
    throw error;
  }

  async function loadFlow() {
    try {
      status.textContent = 'Loading aggregate...';
      const jql = jqlInput.value.trim();
      const result = await client.invoke('queryAggregate', {
        jql,
        viewType: 'flow',
        maxIssues: 2000,
        projectKey
      });
      chart.render(result.aggregate);
      renderIssueRows(result.sampleIssues || []);
      const loaded = result.meta?.sourceCount || 0;
      const total = result.meta?.totalAvailable || loaded;
      const truncated = result.meta?.truncated ? ' (partial)' : '';
      const boundNote = result.meta?.jqlApplied && result.meta?.jqlApplied !== result.meta?.jqlRequested
        ? ' Auto-bounded unscoped JQL to last 90 days.'
        : '';
      status.textContent = `Loaded ${loaded}/${total} issues${truncated}. Cache hit: ${result.meta?.cacheHit ? 'yes' : 'no'}.${boundNote}`;
    } catch (error) {
      status.textContent = `Load failed: ${error.message || String(error)}`;
    }
  }

  chart.onBarClick = async (bucketKey) => {
    try {
      const baseJql = jqlInput.value.trim();
      const statusClause = getStatusClause(bucketKey, statusGroups);
      const jql = statusClause ? `(${baseJql}) AND (${statusClause})` : baseJql;
      status.textContent = `Loading drill-down for ${bucketKey}...`;
      const issues = await client.invoke('listIssues', { jql, maxIssues: 100, projectKey });
      renderIssueRows(issues || []);
      status.textContent = `Drill-down loaded for ${bucketKey}.`;
    } catch (error) {
      status.textContent = `Drill-down failed: ${error.message || String(error)}`;
    }
  };

  $('loadBtn').addEventListener('click', loadFlow);
  $('csvBtn').addEventListener('click', async () => {
    try {
      const jql = jqlInput.value.trim();
      const out = await client.invoke('exportIssuesCsv', { jql, maxIssues: 1000, projectKey });
      if (out?.fileName && out?.content) {
        downloadCsv(out.fileName, out.content);
      }
    } catch (error) {
      status.textContent = `CSV export failed: ${error.message || String(error)}`;
    }
  });

  await loadFlow();
}

main().catch((error) => {
  $('statusText').textContent = `Error: ${error.message}`;
});
