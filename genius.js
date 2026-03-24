import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://kbborotdivfkufzdjwfr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYm9yb3RkaXZma3VmemRqd2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODAwMzAsImV4cCI6MjA4OTg1NjAzMH0.B4BpKOdIol4jNyIjEcUvzSwsfo93u7l98PeKo0QS1-8'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 2. IDENTIFICATION AUTOMATIQUE DE LA PISTE
// Si l'URL est ".../track1.html", currentTrackId sera "track1"
const currentTrackId = window.location.pathname.split('/').pop().replace('.html', '');

let isLocked = false;
let contributionMode = false;
let tempSelection = "";

// 3. INITIALISATION DES BOUTONS ET DU MODAL
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-mode-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            contributionMode = !contributionMode;
            addBtn.innerText = contributionMode ? "MODE CONTRIBUTION : ON" : "MODE CONTRIBUTION : OFF";
            addBtn.style.background = contributionMode ? "#28a745" : "#ff4141";
        });
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const name = document.getElementById('author-name').value;
            const exp = document.getElementById('explanation-input').value;
            if (!name || !exp) return alert("Remplis tout, batard !");

            const { error } = await supabase.from('annotations').insert([{ 
                track_id: currentTrackId, 
                selected_text: tempSelection, 
                explanation: exp,
                user_name: name,
                likes: 0
            }]);

            if (!error) location.reload();
            else alert("Erreur : " + error.message);
        });
    }

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('add-modal').style.display = 'none';
        });
    }

    loadAnnotations();
});

// 4. CHARGEMENT DES DONNÉES
async function loadAnnotations() {
    const { data: annotations, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('track_id', currentTrackId)
        .order('likes', { ascending: false });

    if (error) return console.error(error);

    if (annotations) {
        const grouped = annotations.reduce((acc, ann) => {
            const txt = ann.selected_text.trim();
            if (!acc[txt]) acc[txt] = [];
            acc[txt].push(ann);
            return acc;
        }, {});

        let lyricsPara = document.querySelector('.lyrics p');
        if (!lyricsPara) return;
        
        let html = lyricsPara.innerHTML;

        for (const [phrase, items] of Object.entries(grouped)) {
            const regexFriendly = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\n<br\\s*\\/?>]+');
            const regex = new RegExp(`(${regexFriendly})`, 'g');
            const jsonExplanations = JSON.stringify(items).replace(/"/g, '&quot;');
            html = html.replace(regex, `<span class="line" data-infos="${jsonExplanations}">$1</span>`);
        }
        lyricsPara.innerHTML = html;
        setupInteractions();
    }
}

// 5. SYSTÈME DE LIKES AVEC IP
window.handleLike = async (event, id, currentLikes) => {
    event.stopPropagation();
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        const { data: existingLike } = await supabase
            .from('likes_tracking')
            .select('ip_address')
            .eq('annotation_id', id)
            .eq('ip_address', ip);

        if (existingLike && existingLike.length > 0) {
            alert("Tu as déjà liké cette analyse, force pas !");
            return;
        }

        const { error: updateError } = await supabase
            .from('annotations')
            .update({ likes: currentLikes + 1 })
            .eq('id', id);

        if (!updateError) {
            await supabase.from('likes_tracking').insert([{ annotation_id: id, ip_address: ip }]);
            event.target.style.color = "#ff4141";
            setTimeout(() => location.reload(), 300);
        }
    } catch (err) { console.error(err); }
};

// 6. INTERACTIONS ET MODAL
function setupInteractions() {
    const box = document.getElementById('explanation');

    document.addEventListener('mouseover', (e) => {
        const line = e.target.closest('.line');
        if (line && !isLocked) showExplanations(line);
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.line') && !isLocked) box.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        const line = e.target.closest('.line');
        if (line) {
            isLocked = true;
            showExplanations(line);
            box.style.borderLeftColor = "#28a745";
        } else if (!e.target.closest('#explanation') && !e.target.closest('#add-modal')) {
            isLocked = false;
            box.classList.remove('active');
            box.style.borderLeftColor = "#ff4141";
        }
    });
}

function showExplanations(element) {
    const box = document.getElementById('explanation');
    const textContainer = document.getElementById('explanation-text');
    const data = JSON.parse(element.getAttribute('data-infos'));

    textContainer.innerHTML = data.map((item) => `
        <div class="analysis-block">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <strong style="color:#ff4141; font-size:0.8em;">PAR : ${item.user_name.toUpperCase()}</strong>
                <div style="text-align:center;">
                    <span class="like-btn not-liked" onclick="window.handleLike(event, ${item.id}, ${item.likes})">❤</span>
                    <div style="font-size:0.7em; color:#777;">${item.likes}</div>
                </div>
            </div>
            <p style="margin-top:10px; font-size:0.95em;">${item.explanation}</p>
        </div>
    `).join('');
    box.classList.add('active');
}

document.addEventListener('mouseup', () => {
    if (!contributionMode) return;
    const selection = window.getSelection().toString().trim();
    if (selection.length > 5) {
        tempSelection = selection;
        document.getElementById('add-modal').style.display = 'block';
    }
});
