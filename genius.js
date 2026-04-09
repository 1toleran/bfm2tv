import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://kbborotdivfkufzdjwfr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYm9yb3RkaXZma3VmemRqd2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODAwMzAsImV4cCI6MjA4OTg1NjAzMH0.B4BpKOdIol4jNyIjEcUvzSwsfo93u7l98PeKo0QS1-8'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const currentTrackId = window.location.pathname.split('/').pop().replace('.html', '');

let isLocked = false;
let contributionMode = false;
let tempSelection = "";

// 3. INITIALISATION DES BOUTONS ET DU MODAL
// 3. INITIALISATION DES BOUTONS ET DU MODAL
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-mode-btn');
    
    // NOUVEAU : Variables du modal de mot de passe
    const pwdModal = document.getElementById('password-modal');
    const pwdSubmit = document.getElementById('password-submit-btn');
    const pwdCancel = document.getElementById('password-cancel-btn');
    const pwdInput = document.getElementById('legacy-password');
    const pwdError = document.getElementById('password-error');

    // 1. Clic sur le bouton d'activation
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (!contributionMode) {
                // On affiche notre belle modale rouge
                pwdModal.style.display = 'block';
                pwdInput.value = ''; // On vide le champ
                pwdError.style.display = 'none'; // On cache l'erreur
                pwdInput.focus(); // On met le curseur direct dedans
            } else {
                // Si on veut éteindre, on éteint direct
                contributionMode = false;
                addBtn.innerText = "MODE CONTRIBUTION : OFF";
                addBtn.style.background = "#ff4141";
            }
        });
    }

    // 2. Clic sur VALIDER le mot de passe
    if (pwdSubmit) {
        pwdSubmit.addEventListener('click', () => {
            const password = pwdInput.value.trim().toLowerCase();
            
            if (password === "johnlegacy") {
                // VICTOIRE
                contributionMode = true;
                addBtn.innerText = "MODE CONTRIBUTION : ON";
                addBtn.style.background = "#28a745";
                pwdModal.style.display = 'none'; // On cache la modale
            } else {
                // ÉCHEC
                pwdError.style.display = 'block'; // On affiche le texte rouge
                pwdInput.value = ''; // On vide le champ pour qu'il réessaie
            }
        });
    }

    // 3. Clic sur ANNULER
    if (pwdCancel) {
        pwdCancel.addEventListener('click', () => {
            pwdModal.style.display = 'none';
        });
    }
    // Validation avec la touche "Entrée"
    if (pwdInput) {
        pwdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                pwdSubmit.click();
            }
        });
    }

    // --- NOUVEAU : SYSTÈME D'HABILITATION NIVEAU 2 (AUTEURS) ---
    const isAuthorCheck = document.getElementById('is-author-check');
    const authorModal = document.getElementById('author-auth-modal');
    const authorSubmit = document.getElementById('author-submit-btn');
    const authorCancel = document.getElementById('author-cancel-btn');
    const authorInput = document.getElementById('author-password');
    const authorError = document.getElementById('author-error');

    // 1. Quand quelqu'un clique sur la case "Je suis l'auteur"
    if (isAuthorCheck) {
        isAuthorCheck.addEventListener('click', (e) => {
            if (isAuthorCheck.checked) {
                e.preventDefault(); 
                authorModal.style.display = 'block';
                authorInput.value = '';
                authorError.style.display = 'none';
                authorInput.focus();
            }
        });
    }

    // 2. Quand l'auteur valide son code secret
    if (authorSubmit) {
        authorSubmit.addEventListener('click', () => {
            const codeSaisi = authorInput.value.trim().toLowerCase();
            const codesAutorises = (window.ALLOWED_AUTHOR_CODES || []).map(c => c.toLowerCase());

            if (codesAutorises.includes(codeSaisi)) {
                isAuthorCheck.checked = true; 
                authorModal.style.display = 'none';
            } else {
                authorError.style.display = 'block';
                authorInput.value = ''; 
            }
        });
    }

    // 3. Validation avec la touche "Entrée"
    if (authorInput) {
        authorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authorSubmit.click();
        });
    }

    // 4. Si l'utilisateur annule
    if (authorCancel) {
        authorCancel.addEventListener('click', () => {
            authorModal.style.display = 'none';
            isAuthorCheck.checked = false; 
        });
    }

    // =====================================================================
    // ^^^ --- FIN DU NOUVEAU CODE --- ^^^
    // =====================================================================
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const name = document.getElementById('author-name').value;
            const exp = document.getElementById('explanation-input').value;
            const imageInput = document.getElementById('image-upload');
            const file = imageInput ? imageInput.files[0] : null;
            
            // NOUVEAU : On récupère l'état de la case à cocher
            const isAuthorCheckbox = document.getElementById('is-author-check');
            const isAuthor = isAuthorCheckbox ? isAuthorCheckbox.checked : false;

            if (!name || !exp) return alert("Remplis tout, batard !");

            // UX : On bloque le bouton pendant le chargement
            submitBtn.innerText = "ENVOI EN COURS...";
            submitBtn.disabled = true;

            let imageUrl = null;

            // GESTION DE L'IMAGE
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, file);

                if (uploadError) {
                    alert("Erreur upload image : " + uploadError.message);
                    submitBtn.innerText = "VALIDER";
                    submitBtn.disabled = false;
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrlData.publicUrl;
            }

            // INSERTION DANS LA BASE DE DONNÉES
            // INSERTION DANS LA BASE DE DONNÉES
            const { data: insertData, error } = await supabase.from('annotations').insert([{ 
                track_id: currentTrackId, 
                selected_text: tempSelection, 
                explanation: exp,
                user_name: name,
                likes: 0,
                image_url: imageUrl,
                is_author: isAuthor
            }]).select(); // <-- IMPORTANT : .select() permet de récupérer l'ID généré

            if (!error && insertData && insertData.length > 0) {
                // NOUVEAU : On sauvegarde l'ID dans la mémoire du navigateur
                const newId = insertData[0].id;
                let myComments = JSON.parse(localStorage.getItem('my_genius_comments') || '[]');
                myComments.push(newId);
                localStorage.setItem('my_genius_comments', JSON.stringify(myComments));

                location.reload();
            }
            else {
                alert("Erreur BDD : " + (error ? error.message : "Erreur inconnue"));
                submitBtn.innerText = "VALIDER";
                submitBtn.disabled = false;
            }
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
            alert("T'as déjà liké cette analyse fdp");
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

// --- FONCTION DE SUPPRESSION ---
window.deleteAnnotation = async (event, id) => {
    event.stopPropagation(); // Empêche de fermer la boîte
    
    // Demande de confirmation
    if (confirm("Es-tu sûr de vouloir supprimer cette analyse définitivement ?")) {
        
        // 1. Suppression dans Supabase
        const { error } = await supabase
            .from('annotations')
            .delete()
            .eq('id', id);

        if (!error) {
            // 2. Suppression dans la mémoire du navigateur
            let myComments = JSON.parse(localStorage.getItem('my_genius_comments') || '[]');
            myComments = myComments.filter(commentId => commentId !== id);
            localStorage.setItem('my_genius_comments', JSON.stringify(myComments));
            
            // 3. Rechargement de la page
            location.reload();
        } else {
            alert("Erreur lors de la suppression : " + error.message);
        }
    }
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
    
    // NOUVEAU : On utilise 'let' car on va trier (modifier) ce tableau
    let data = JSON.parse(element.getAttribute('data-infos'));

    // NOUVEAU : Le tri magique. 
    // Règle 1 : L'auteur passe en premier. 
    // Règle 2 : Ensuite, on trie par nombre de likes décroissant.
    data.sort((a, b) => {
        if (b.is_author && !a.is_author) return 1;
        if (!b.is_author && a.is_author) return -1;
        return b.likes - a.likes;
    });

    // NOUVEAU : On récupère la liste des commentaires de cet utilisateur
    const myComments = JSON.parse(localStorage.getItem('my_genius_comments') || '[]');

    textContainer.innerHTML = data.map((item) => {
        const imgHtml = item.image_url 
            ? `<img src="${item.image_url}" style="max-width:100%; border-radius:4px; margin-top:10px; border:1px solid #555;">` 
            : '';

        const authorStyle = item.is_author 
            ? `border: 2px solid #ff4141; box-shadow: 0 0 15px rgba(255, 65, 65, 0.3); transform: scale(1.02); background: #3d1a1a; margin-left: -5px; margin-right: -5px;` 
            : `background: #333; border: 1px solid transparent;`;
        
        const badgeAuthor = item.is_author 
            ? `<span style="background:#ff4141; color:white; padding:3px 6px; font-size:0.7em; border-radius:3px; margin-left:10px; font-weight:bold; letter-spacing:1px;">AUTEUR CERTIFIÉ</span>` 
            : '';

        // NOUVEAU : La poubelle (s'affiche uniquement si l'ID est dans la mémoire)
        const isMine = myComments.includes(item.id);
        const trashBtn = isMine 
            ? `<div style="margin-top:8px; cursor:pointer; font-size:1.1em; transition:0.2s;" onclick="window.deleteAnnotation(event, ${item.id})" onmouseover="this.style.textShadow='0 0 8px #ff4141'" onmouseout="this.style.textShadow='none'" title="Supprimer mon analyse">🗑️</div>` 
            : '';

        return `
            <div class="analysis-block" style="${authorStyle} padding:15px; margin-bottom:15px; border-radius:4px; transition:0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong style="color:#ff4141; font-size:0.8em; display:flex; align-items:center;">
                        PAR : ${item.user_name.toUpperCase()} ${badgeAuthor}
                    </strong>
                    <div style="text-align:center;">
                        <span class="like-btn not-liked" onclick="window.handleLike(event, ${item.id}, ${item.likes})">❤</span>
                        <div style="font-size:0.7em; color:#777;">${item.likes}</div>
                        ${trashBtn} </div>
                </div>
                <p style="margin-top:10px; font-size:0.95em;">${item.explanation}</p>
                ${imgHtml}
            </div>
        `;
    }).join('');
    
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
