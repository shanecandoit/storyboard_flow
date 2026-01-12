const Characters = {
    list: [],

    async init() {
        await this.refresh();
        this.renderList();
    },

    async refresh() {
        try {
            const charsStr = await getCharacters();
            this.list = JSON.parse(charsStr);
        } catch (err) {
            console.error('Error fetching characters:', err);
            this.list = [];
        }
    },

    renderList() {
        const container = document.getElementById('characterList');
        if (!container) return;

        if (this.list.length === 0) {
            container.innerHTML = '<div class="empty-state">No characters yet.</div>';
            return;
        }

        container.innerHTML = this.list.map(char => `
            <div class="character-card">
                <div class="character-img">
                    ${char.image_path ? `<img src="${char.image_path}" alt="${char.name}">` : '<div class="no-img">No Image</div>'}
                </div>
                <div class="character-info">
                    <strong>${char.name}</strong>
                    <p>${char.description}</p>
                </div>
                <button class="delete-btn" onclick="Characters.delete('${char.id}')">&times;</button>
            </div>
        `).join('');
    },

    async add(name, description, imageData) {
        try {
            await addCharacter(name, description, imageData);
            await this.refresh();
            this.renderList();
            return true;
        } catch (err) {
            alert('Error adding character: ' + err);
            return false;
        }
    },

    async delete(id) {
        if (!confirm('Delete this character?')) return;
        try {
            await deleteCharacter(id);
            await this.refresh();
            this.renderList();
        } catch (err) {
            alert('Error deleting character: ' + err);
        }
    },

    showAddModal() {
        const modal = document.getElementById('addCharacterModal');
        if (modal) modal.style.display = 'flex';
    },

    hideAddModal() {
        const modal = document.getElementById('addCharacterModal');
        if (modal) modal.style.display = 'none';
        // Clear form
        document.getElementById('charName').value = '';
        document.getElementById('charDesc').value = '';
        document.getElementById('charImageInput').value = '';
        document.getElementById('charImagePreview').innerHTML = '';
    }
};

// Image upload handling
function handleCharImageSelect(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('charImagePreview');
        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">`;
        preview.dataset.base64 = e.target.result;
    };
    reader.readAsDataURL(file);
}

function submitNewCharacter() {
    const name = document.getElementById('charName').value;
    const desc = document.getElementById('charDesc').value;
    const preview = document.getElementById('charImagePreview');
    const imageData = preview.dataset.base64 || '';

    if (!name) {
        alert('Name is required');
        return;
    }

    Characters.add(name, desc, imageData).then(success => {
        if (success) Characters.hideAddModal();
    });
}
