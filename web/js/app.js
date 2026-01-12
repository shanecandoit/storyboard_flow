// Theme handling
const Theme = {
    key: 'theme',
    get() {
        try {
            return localStorage.getItem(this.key) || 'light';
        } catch (e) {
            return 'light';
        }
    },
    apply(t) {
        if (t === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        try {
            localStorage.setItem(this.key, t);
        } catch (e) {
            // localStorage not available - theme won't persist
        }
        updateThemeToggle();
    },
    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        this.apply(isDark ? 'light' : 'dark');
    }
};

function updateThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark');
    btn.textContent = isDark ? 'dark' : 'light';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

// Main application state and handlers
const app = {
    currentProject: null,
    selectedPanelId: null,

    async init() {
        // Create a default project on startup
        this.newProject();
        await this.refreshPanels();
        // Initialize theme
        Theme.apply(Theme.get());
        const btn = document.getElementById('themeToggle');
        if (btn) btn.addEventListener('click', () => Theme.toggle());
    },

    async newProject() {
        // Auto-generate name: project_YYYY-MM-DD_HH-mm-ss
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const name = `project_${timestamp}`;

        try {
            await createNewProject(name);
            this.currentProject = { name };
            this.selectedPanelId = null;
            document.getElementById('projectName').textContent = name;
            await this.refreshPanels();
            this.clearEditor();
        } catch (err) {
            alert('Error creating project: ' + err);
        }
    },

    async saveProject() {
        if (!this.currentProject) {
            alert('No project to save');
            return;
        }

        try {
            await saveProject();
        } catch (err) {
            alert('Error saving project: ' + err);
        }
    },

    async loadProject() {
        try {
            const resultStr = await loadProject();
            const result = JSON.parse(resultStr);
            this.currentProject = { name: result.name || 'Loaded Project' };
            this.selectedPanelId = null;
            document.getElementById('projectName').textContent = this.currentProject.name;
            await this.refreshPanels();
            this.clearEditor();
        } catch (err) {
            alert('Error loading project: ' + err);
        }
    },

    async addPanel() {
        try {
            const panelStr = await createPanel();
            const panel = JSON.parse(panelStr);
            await this.refreshPanels();
            this.selectPanel(panel.id);
        } catch (err) {
            alert('Error adding panel: ' + err);
        }
    },

    async duplicatePanel(panelId) {
        try {
            const panelStr = await duplicatePanel(panelId);
            const panel = JSON.parse(panelStr);
            await this.refreshPanels();
            this.selectPanel(panel.id);
        } catch (err) {
            alert('Error duplicating panel: ' + err);
        }
    },

    async refreshPanels() {
        try {
            const panelsStr = await getPanels();
            const panels = JSON.parse(panelsStr);
            renderPanelGrid(panels);
        } catch (err) {
            console.error('Error refreshing panels:', err);
        }
    },

    selectPanel(panelId) {
        this.selectedPanelId = panelId;
        this.refreshPanels(); // Re-render to show selection
        this.loadPanelEditor(panelId);
    },

    async loadPanelEditor(panelId) {
        try {
            const panelsStr = await getPanels();
            const panels = JSON.parse(panelsStr);
            const panel = panels.find(p => p.id === panelId);
            if (!panel) return;

            renderPanelEditor(panel);
        } catch (err) {
            console.error('Error loading panel editor:', err);
        }
    },

    clearEditor() {
        const editor = document.getElementById('panelEditor');
        editor.innerHTML = '<p class="placeholder">Select a panel to edit</p>';
    },

    async updatePanelField(panelId, field, value) {
        try {
            await updatePanel(panelId, field, value);
        } catch (err) {
            console.error('Error updating panel:', err);
        }
    },

    async deletePanel(panelId) {
        // Soft delete/Direct delete without confirmation as requested

        try {
            await deletePanel(panelId);
            if (this.selectedPanelId === panelId) {
                this.selectedPanelId = null;
                this.clearEditor();
            }
            await this.refreshPanels();
        } catch (err) {
            alert('Error deleting panel: ' + err);
        }
    },

    async renameProject() {
        if (!this.currentProject) {
            alert('No project to rename');
            return;
        }

        const newName = prompt('Enter new project name:', this.currentProject.name);
        if (!newName || newName.trim() === '') {
            return; // User cancelled or entered empty name
        }

        try {
            await renameProject(newName.trim());
            this.currentProject.name = newName.trim();
            document.getElementById('projectName').textContent = newName.trim();
        } catch (err) {
            alert('Error renaming project: ' + err);
        }
    },

    async reorderPanel(panelId, newIndex) {
        try {
            await reorderPanel(panelId, newIndex);
            await this.refreshPanels();
        } catch (err) {
            console.error('Error reordering panel:', err);
        }
    },

    async movePanel(panelId, direction) {
        try {
            const panelsStr = await getPanels();
            const panels = JSON.parse(panelsStr);
            const index = panels.findIndex(p => p.id === panelId);

            if (index === -1) return;

            const newIndex = index + direction;

            // Check bounds
            if (newIndex < 0 || newIndex >= panels.length) return;

            await this.reorderPanel(panelId, newIndex);
        } catch (err) {
            console.error('Error moving panel:', err);
        }
    },

    async exportPdf() {
        if (!this.currentProject) {
            alert('No project to export');
            return;
        }

        try {
            const panelsStr = await getPanels();
            const panels = JSON.parse(panelsStr);

            const title = this.currentProject.name || 'Storyboard Export';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${title}_export_${timestamp}.html`;

            // build print-friendly HTML
            const css = `
                <style>
                @media print {
                  body { background: white; color: black; }
                  header, .toolbar, .canvas-toolbar, .theme-toggle { display: none !important; }
                  .panel-page { page-break-after: always; width: 100%; padding: 12px; }
                  .panel-thumbnail img { max-width: 100%; height: auto; page-break-inside: avoid; }
                  @page { size: A4; margin: 15mm; }
                }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; }
                h1 { font-size: 20px; margin-bottom: 12px; }
                .panel { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
                .meta { font-size: 13px; color: #222; }
                </style>
            `;

            let body = `<h1>${escapeHtml(title)}</h1>`;
            for (const p of panels) {
                body += `<div class="panel-page"><div class="panel"><div class="panel-thumbnail">`;
                if (p.image_data) body += `<img src="${p.image_data}" alt="panel-${p.order}">`;
                else body += `<div style="width:320px;height:180px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999">No image</div>`;
                body += `</div><div class="meta">`;
                body += `<strong>Panel ${p.order + 1}</strong><br>`;
                if (p.action_notes) body += `<div><em>Action:</em> ${escapeHtml(p.action_notes)}</div>`;
                if (p.dialogue) body += `<div><em>Dialogue:</em> ${escapeHtml(p.dialogue)}</div>`;
                body += `<div><em>Shot:</em> ${escapeHtml(p.shot_type || '')} | <em>Angle:</em> ${escapeHtml(p.camera_angle || '')} | <em>Move:</em> ${escapeHtml(p.camera_move || '')}</div>`;
                body += `<div><em>Duration:</em> ${p.duration}s</div>`;
                body += `</div></div></div>`;
            }

            const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${css}</head><body>${body}</body></html>`;

            // Save HTML to disk (assets/prints)
            try {
                await saveExportHTML(filename, html);
            } catch (e) {
                console.warn('Could not save export HTML:', e);
            }

            // print via hidden iframe
            await printHtml(html);

        } catch (err) {
            alert('Error exporting: ' + err);
        }
    }
};

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Helpers
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>\"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
}

function printHtml(html) {
    return new Promise((resolve, reject) => {
        try {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();

            const tryPrint = () => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        resolve();
                    }, 500);
                } catch (e) {
                    document.body.removeChild(iframe);
                    reject(e);
                }
            };

            // Wait for images to load
            iframe.onload = () => {
                const imgs = doc.images || [];
                const promises = [];
                for (let i = 0; i < imgs.length; i++) {
                    if (!imgs[i].complete) {
                        promises.push(new Promise(r => { imgs[i].onload = r; imgs[i].onerror = r; }));
                    }
                }
                Promise.all(promises).then(tryPrint).catch(tryPrint);
            };

            // In case onload doesn't fire
            setTimeout(tryPrint, 800);
        } catch (e) {
            reject(e);
        }
    });
}
