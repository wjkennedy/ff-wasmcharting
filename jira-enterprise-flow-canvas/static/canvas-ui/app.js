const COLORS = {
  backlog: [0.298, 0.604, 1.0],
  inProgress: [0.212, 0.702, 0.494],
  done: [1.0, 0.337, 0.188],
  other: [0.396, 0.329, 0.753]
};

const $ = (id) => document.getElementById(id);

class FlowPointCloudWebGL {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!this.gl) throw new Error('WebGL not available');
    this.program = this.buildProgram();
    this.positionBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
    this.points = [];
    this.pointSize = 5;
    this.onLaneClick = null;
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
        gl_PointSize = ${this.pointSize.toFixed(1)};
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, 0.95);
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
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (this.lastDataset) {
      this.render(this.lastDataset);
    }
  }

  toNdc(xNorm, yNorm) {
    return [xNorm * 2 - 1, 1 - yNorm * 2];
  }

  toScreen(xNorm, yNorm) {
    return {
      x: xNorm * this.canvas.clientWidth,
      y: yNorm * this.canvas.clientHeight
    };
  }

  render(dataset) {
    this.lastDataset = dataset;
    this.points = dataset?.points || [];
    const gl = this.gl;
    const vertices = [];
    const colors = [];

    for (const p of this.points) {
      const [x, y] = this.toNdc(p.x, p.y);
      vertices.push(x, y);
      const c = COLORS[p.lane] || COLORS.other;
      colors.push(c[0], c[1], c[2]);
    }

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

    gl.drawArrays(gl.POINTS, 0, vertices.length / 2);
  }

  findNearestPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestDist = Infinity;
    for (const p of this.points) {
      const s = this.toScreen(p.x, p.y);
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return bestDist <= 12 ? best : null;
  }

  installEvents() {
    this.canvas.addEventListener('mousemove', (event) => {
      const hit = this.findNearestPoint(event.clientX, event.clientY);
      if (!hit) {
        this.tooltip.style.display = 'none';
        this.canvas.style.cursor = 'default';
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = `${event.clientX - rect.left}px`;
      this.tooltip.style.top = `${event.clientY - rect.top}px`;
      const ageDays = Number.isFinite(hit?.ageDays) ? hit.ageDays : 0;
      this.tooltip.textContent = `${hit.issueKey || 'issue'} • ${hit.lane || 'lane'} • age ${ageDays.toFixed(1)}d`;
      this.canvas.style.cursor = 'pointer';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
      this.canvas.style.cursor = 'default';
    });

    this.canvas.addEventListener('click', (event) => {
      if (!this.onLaneClick) return;
      const hit = this.findNearestPoint(event.clientX, event.clientY);
      if (hit) {
        this.onLaneClick(hit.lane);
      }
    });
  }
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
      invoke: async (functionKey, payload) => window.__bridge.callBridge('invoke', { functionKey, payload }),
      getContext: async () => window.__bridge.callBridge('getContext')
    };
  }
  throw new Error('Forge bridge is unavailable in this context');
}

async function waitForBridge(timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.__bridge && typeof window.__bridge.callBridge === 'function') return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Forge bridge is unavailable in this context');
}

function laneClause(lane, statusGroups) {
  const statuses = statusGroups?.[lane] || [];
  if (!Array.isArray(statuses) || statuses.length === 0) return '';
  return `status in (${statuses.map((s) => `"${String(s).replaceAll('"', '\\"')}"`).join(', ')})`;
}

async function main() {
  const status = $('statusText');
  const jqlInput = $('jqlInput');
  const errorBanner = $('errorBanner');
  const chart = new FlowPointCloudWebGL($('chart'), $('tooltip'));

  let client;
  let projectKey = '';
  let statusGroups = {};

  try {
    await waitForBridge();
    client = createBridgeClient();
    const bootstrap = await client.invoke('getBootstrap');
    projectKey = bootstrap?.viewer?.projectKey || '';
    statusGroups = bootstrap?.config?.statusGroups || {};
    if (!projectKey) {
      const ctx = await client.getContext();
      projectKey = ctx?.extension?.project?.key || '';
    }
  } catch (error) {
    errorBanner.hidden = false;
    throw error;
  }

  async function loadFlow() {
    try {
      status.textContent = 'Loading flow model...';
      const jql = jqlInput.value.trim();
      const result = await client.invoke('queryAggregate', {
        jql,
        projectKey,
        viewType: 'flow',
        maxIssues: 5000
      });
      chart.render(result.aggregate);
      renderIssueRows(result.sampleIssues || []);
      const loaded = result.meta?.sourceCount || 0;
      const total = result.meta?.totalAvailable || loaded;
      status.textContent = `Loaded ${loaded}/${total} issues. Applied JQL: ${result.meta?.jqlApplied || jql}`;
    } catch (error) {
      status.textContent = `Load failed: ${error.message || String(error)}`;
    }
  }

  chart.onLaneClick = async (lane) => {
    try {
      const base = jqlInput.value.trim();
      const clause = laneClause(lane, statusGroups);
      const jql = clause ? `(${base}) AND (${clause})` : base;
      status.textContent = `Loading ${lane} lane...`;
      const issues = await client.invoke('listIssues', { jql, projectKey, maxIssues: 200 });
      renderIssueRows(issues || []);
      status.textContent = `Drill-down loaded for ${lane}.`;
    } catch (error) {
      status.textContent = `Drill-down failed: ${error.message || String(error)}`;
    }
  };

  $('loadBtn').addEventListener('click', loadFlow);
  $('csvBtn').addEventListener('click', async () => {
    try {
      const out = await client.invoke('exportIssuesCsv', {
        jql: jqlInput.value.trim(),
        projectKey,
        maxIssues: 1000
      });
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
  $('statusText').textContent = `Error: ${error.message || String(error)}`;
});
