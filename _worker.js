export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/proxy')) {
      const targetUrl = request.headers.get('X-Target-URL');
      if (!targetUrl) {
        return new Response('Missing X-Target-URL header', { status: 400 });
      }

      const newHeaders = new Headers(request.headers);
      newHeaders.delete('host');

      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: newHeaders,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
          redirect: 'follow'
        });

        const corsHeaders = new Headers(response.headers);
        corsHeaders.set('Access-Control-Allow-Origin', '*');
        corsHeaders.set('Access-Control-Allow-Headers', '*');
        corsHeaders.set('Access-Control-Allow-Methods', '*');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: corsHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, errors: [{ message: err.message }] }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*'
        }
      });
    }

    return new Response(htmlContent, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CF Pages 历史版本 management 工具</title>
    <style>
        :root {
            --primary: #f63;
            --primary-hover: #e52;
            --blue: #0070f3;
            --blue-hover: #0051cb;
            --danger: #e00;
            --danger-hover: #b00;
            --bg: #f4f6f8;
            --card-bg: #ffffff;
            --text: #2c3e50;
            --border: #e2e8f0;
        }
        
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 960px; margin: 40px auto; padding: 0 20px; color: var(--text); background-color: var(--bg); line-height: 1.5; }
        .card { background: var(--card-bg); padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 25px; border: 1px solid var(--border); }
        h2, h3 { margin-top: 0; color: #1e293b; font-weight: 700; }
        h2 { font-size: 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #475569; }
        input[type="text"], input[type="password"], select { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; background-color: #fff; transition: all 0.2s; color: var(--text); }
        input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(255, 102, 51, 0.15); outline: none; }
        
        .btn-group { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
        button { border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 600; flex: 1; min-width: 160px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        /* 🎨 按钮纯色美化：调低亮度，增加饱和度，移除渐变色 */
        .btn-orange { background-color: var(--primary); color: white; }
        .btn-orange:hover { background-color: var(--primary-hover); }
        
        .btn-blue { background-color: var(--blue); color: white; }
        .btn-blue:hover { background-color: var(--blue-hover); }
        
        .btn-red { background-color: var(--danger); color: white; }
        .btn-red:hover { background-color: var(--danger-hover); }
        
        button:disabled { background: #cbd5e1 !important; color: #94a3b8 !important; cursor: not-allowed; box-shadow: none; transform: none !important; }
        button:active:not(:disabled) { transform: translateY(1px); }
        
        /* 表格样式 */
        .table-container { margin-top: 15px; overflow-x: auto; max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; box-shadow: inset 0 0 6px rgba(0,0,0,0.01); }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th, td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
        th { background: #f8fafc; position: sticky; top: 0; z-index: 10; color: #64748b; font-weight: 600; }
        tr:hover { background: #f8fafc; }
        
        .badge { padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; }
        .badge-production { background: #fff7e6; color: #fa8c16; border: 1px solid #ffd591; }
        .badge-preview { background: #f0f5ff; color: #2f54eb; border: 1px solid #adc6ff; }
        .badge-active { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; margin-left: 5px; }
        
        #log { background: #1e293b; color: #38bdf8; padding: 18px; border-radius: 8px; height: 180px; overflow-y: auto; font-family: "Fira Code", Consolas, Monaco, monospace; white-space: pre-wrap; margin-top: 15px; font-size: 13px; line-height: 1.6; box-shadow: inset 0 2px 8px rgba(0,0,0,0.2); }
        .counter-badge { background-color: var(--danger); color: white; padding: 2px 8px; border-radius: 10px; font-size: 13px; font-weight: bold; margin-left: 5px; }
        
        /* 自定义确认模态框 */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
        .modal-overlay.active { opacity: 1; pointer-events: auto; }
        .modal-box { background: white; padding: 28px; border-radius: 12px; max-width: 440px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); text-align: center; }
        .modal-overlay.active .modal-box { transform: scale(1); }
        .modal-icon { width: 56px; height: 56px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px; }
        .modal-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }
        .modal-text { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5; }
        .modal-buttons { display: flex; gap: 12px; justify-content: center; }
        .modal-btn { flex: 1; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: background 0.2s; }
        .modal-btn-cancel { background: #f1f5f9; color: #475569; }
        .modal-btn-cancel:hover { background: #e2e8f0; }
        .modal-btn-confirm { background: var(--danger); color: white; }
        .modal-btn-confirm:hover { background: var(--danger-hover); }
    </style>
</head>
<body>

<div class="card">
    <h2>🧹 CF Pages 历史版本删除工具</h2>
    
    <div class="form-group">
        <label>Account ID (账户 ID):</label>
        <input type="text" id="accountId" placeholder="输入 32 位 Cloudflare 账户 ID">
    </div>
    <div class="form-group">
        <label>API Token (令牌):</label>
        <input type="password" id="apiToken" placeholder="输入具有 Pages:Edit 权限的 Token">
    </div>

    <button class="btn-orange" id="loadProjectsBtn" onclick="loadProjects()">🔍 1. 加载项目列表</button>

    <div class="form-group" id="projectSelectGroup" style="margin-top: 20px; display: none;">
        <label>选择 Pages 项目:</label>
        <select id="projectSelect" onchange="onProjectChange()">
            <option value="">-- 请选择一个项目 --</option>
        </select>
    </div>

    <div class="btn-group">
        <button class="btn-blue" id="fetchBtn" onclick="fetchDeployments()" disabled>📋 2. 获取部署列表</button>
        <button class="btn-red" id="deleteBtn" onclick="confirmDeleteBox()" disabled>🗑️ 3. 开始删除选中版本 <span id="btnCounter"></span></button>
    </div>
</div>

<div class="card" id="listCard" style="display: none;">
    <h3>📋 部署版本列表 <span id="countInfo" style="font-size: 14px; color: #666;"></span></h3>
    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 6px;">
            <input type="checkbox" id="selectAll" onclick="toggleSelectAll(this)" style="width:16px; height:16px; cursor:pointer;"> 
            <label style="display:inline; font-weight:normal; margin:0; cursor:pointer;" for="selectAll">全选可删除版本</label>
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #475569;">
            当前已选中:<span id="selectedCount" class="counter-badge">0</span> 个版本
        </div>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th width="50">选择</th>
                    <th>环境/状态</th>
                    <th>分支</th>
                    <th>部署 ID / 提交信息</th>
                    <th>创建时间</th>
                </tr>
            </thead>
            <tbody id="deploymentTableBody"></tbody>
        </table>
    </div>
</div>

<div class="card">
    <h3>运行日志：</h3>
    <div id="log">等待操作...</div>
</div>

<div class="modal-overlay" id="confirmModal">
    <div class="modal-box">
        <div class="modal-icon">⚠️</div>
        <div class="modal-title" id="modalTitle">确认批量删除</div>
        <div class="modal-text" id="modalText">您确定要删除选中的历史版本吗？</div>
        <div class="modal-buttons">
            <button class="modal-btn modal-btn-cancel" onclick="closeModal()">取消</button>
            <button class="modal-btn modal-btn-confirm" onclick="submitDelete()">确认删除</button>
        </div>
    </div>
</div>

<script>
    document.getElementById('accountId').value = localStorage.getItem('cf_proxy_account_id') || '';
    document.getElementById('apiToken').value = localStorage.getItem('cf_proxy_api_token') || '';

    async function proxyFetch(targetUrl, options = {}) {
        const proxyUrl = '/api/proxy';
        const headers = options.headers || {};
        headers['X-Target-URL'] = targetUrl;
        return fetch(proxyUrl, { ...options, headers: headers });
    }

    async function loadProjects() {
        const accountId = document.getElementById('accountId').value.trim();
        const apiToken = document.getElementById('apiToken').value.trim();
        const logDiv = document.getElementById('log');
        const selectGroup = document.getElementById('projectSelectGroup');
        const select = document.getElementById('projectSelect');

        if (!accountId || !apiToken) {
            alert('请先填写 Account ID 和 API Token！');
            return;
        }

        localStorage.setItem('cf_proxy_account_id', accountId);
        localStorage.setItem('cf_proxy_api_token', apiToken);

        logDiv.innerHTML = "🔄 正在通过 Worker 代理获取项目列表...\\n";
        select.innerHTML = '<option value="">-- 请选择一个项目 --</option>';
        selectGroup.style.display = 'none';
        document.getElementById('fetchBtn').disabled = true;

        const targetUrl = "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/pages/projects";

        try {
            const res = await proxyFetch(targetUrl, {
                headers: { 'Authorization': "Bearer " + apiToken }
            });
            const data = await res.json();

            if (!data || !data.success) {
                const errMsg = data && data.errors ? JSON.stringify(data.errors) : "未知错误";
                logDiv.innerHTML += "❌ 获取项目失败: " + errMsg + "\\n";
                return;
            }

            const projects = data.result || [];
            logDiv.innerHTML += "📋 成功加载 " + projects.length + " 个项目。\\n";

            if (projects.length === 0) {
                logDiv.innerHTML += "⚠️ 该账户下未找到任何 Pages 项目。\\n";
                return;
            }

            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.innerText = p.name;
                select.appendChild(opt);
            });

            selectGroup.style.display = 'block';
        } catch (err) {
            logDiv.innerHTML += "🚨 请求捕获到异常: " + err.message + "\\n";
        }
    }

    function onProjectChange() {
        document.getElementById('fetchBtn').disabled = !document.getElementById('projectSelect').value;
    }

    function updateSelectedCount() {
        const checkedCount = document.querySelectorAll('.dep-checkbox:checked').length;
        document.getElementById('selectedCount').innerText = checkedCount;
        
        const btnCounter = document.getElementById('btnCounter');
        if (checkedCount > 0) {
            btnCounter.innerText = "(" + checkedCount + ")";
        } else {
            btnCounter.innerText = "";
        }
    }

    async function fetchDeployments() {
        const accountId = document.getElementById('accountId').value.trim();
        const apiToken = document.getElementById('apiToken').value.trim();
        const projectName = document.getElementById('projectSelect').value;
        const logDiv = document.getElementById('log');
        const tbody = document.getElementById('deploymentTableBody');

        logDiv.innerHTML = "🔄 正在获取项目 [" + projectName + "] 的部署列表...\\n";

        const targetUrl = "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/pages/projects/" + projectName + "/deployments";
        
        try {
            const res = await proxyFetch(targetUrl, {
                headers: { 'Authorization': "Bearer " + apiToken }
            });
            const data = await res.json();

            if (!data || !data.success) {
                const errMsg = data && data.errors ? JSON.stringify(data.errors) : "未知错误";
                logDiv.innerHTML += "❌ 获取部署列表失败: " + errMsg + "\\n";
                return;
            }

            const deployments = data.result || [];
            logDiv.innerHTML += "📋 成功获取到 " + deployments.length + " 个部署记录。\\n";
            document.getElementById('countInfo').innerText = "(共 " + deployments.length + " 个)";

            tbody.innerHTML = '';
            document.getElementById('selectAll').checked = false;
            
            deployments.forEach(d => {
                const tr = document.createElement('tr');
                const isActive = d.stage === 'active';
                const hasAlias = d.aliases !== null;
                const canDelete = !isActive && !hasAlias;

                let envClass = d.environment === 'production' ? 'badge-production' : 'badge-preview';
                let statusBadge = "<span class='badge " + envClass + "'>" + (d.environment === 'production' ? '🚀 生产' : '🧪 预览') + "</span>";
                if (isActive) statusBadge += " <span class='badge badge-active'>Active 激活</span>";

                const commitMsg = d.deployment_trigger?.metadata?.commit_message || '无提交信息';
                const branchName = d.deployment_trigger?.metadata?.branch || '-';

                tr.innerHTML = "<td><input type='checkbox' class='dep-checkbox' onchange='updateSelectedCount()' value='" + d.id + "' " + (canDelete ? '' : 'disabled') + " style='width:16px; height:16px; cursor:pointer;'></td>" +
                               "<td>" + statusBadge + "</td>" +
                               "<td><code>" + branchName + "</code></td>" +
                               "<td><div style='font-weight:600; font-size:12px; color:#475569;'>" + d.id + "</div><div style='color:#64748b; font-size:12px; margin-top:2px;'>" + commitMsg + "</div></td>" +
                               "<td>" + new Date(d.created_on).toLocaleString() + "</td>";
                tbody.appendChild(tr);
            });

            document.getElementById('listCard').style.display = 'block';
            document.getElementById('deleteBtn').disabled = false;
            updateSelectedCount();
        } catch (err) {
            logDiv.innerHTML += "🚨 出错: " + err.message + "\\n";
        }
    }

    function toggleSelectAll(master) {
        document.querySelectorAll('.dep-checkbox').forEach(cb => { 
            if(!cb.disabled) cb.checked = master.checked; 
        });
        updateSelectedCount();
    }

    function confirmDeleteBox() {
        const checkboxes = document.querySelectorAll('.dep-checkbox:checked');
        if (checkboxes.length === 0) return alert('请先勾选需要删除的版本！');
        
        document.getElementById('modalText').innerHTML = "您确定要删除选中的 <b style='color:#e00; font-size:16px;'>" + checkboxes.length + "</b> 个历史版本吗？此操作将从 Cloudflare 边缘节点永久抹去记录，<b>不可恢复！</b>";
        document.getElementById('confirmModal').classList.add('active');
    }

    function closeModal() {
        document.getElementById('confirmModal').classList.remove('active');
    }

    async function submitDelete() {
        closeModal();
        
        const checkboxes = document.querySelectorAll('.dep-checkbox:checked');
        const logDiv = document.getElementById('log');

        const accountId = document.getElementById('accountId').value.trim();
        const apiToken = document.getElementById('apiToken').value.trim();
        const projectName = document.getElementById('projectSelect').value;
        
        document.getElementById('loadProjectsBtn').disabled = true;
        document.getElementById('fetchBtn').disabled = true;
        document.getElementById('deleteBtn').disabled = true;

        logDiv.innerHTML = "🚀 开始处理批量删除请求...\\n\\n";

        for (const cb of checkboxes) {
            const id = cb.value;
            logDiv.innerHTML += "正在删除 -> ID: " + id + " ... ";
            logDiv.scrollTop = logDiv.scrollHeight;
            
            const targetUrl = "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/pages/projects/" + projectName + "/deployments/" + id;

            try {
                const res = await proxyFetch(targetUrl, {
                    method: 'DELETE',
                    headers: { 'Authorization': "Bearer " + apiToken }
                });
                const data = await res.json();
                if (data && data.success) {
                    logDiv.innerHTML += "✅ 成功\\n";
                    cb.closest('tr').style.opacity = '0.25';
                    cb.closest('tr').style.background = '#f8fafc';
                    cb.disabled = true;
                    cb.checked = false;
                    updateSelectedCount();
                } else {
                    const errMsg = data && data.errors ? JSON.stringify(data.errors) : "删除失败";
                    logDiv.innerHTML += "❌ 失败: " + errMsg + "\\n";
                }
            } catch (err) {
                logDiv.innerHTML += "❌ 请求失败: " + err.message + "\\n";
            }
            await new Promise(r => setTimeout(r, 450));
        }
        logDiv.innerHTML += "\\n🎉 选定版本已全部清理完毕！\\n";
        logDiv.scrollTop = logDiv.scrollHeight;
        document.getElementById('loadProjectsBtn').disabled = false;
        document.getElementById('fetchBtn').disabled = false;
    }
</script>
</body>
</html>
`;
