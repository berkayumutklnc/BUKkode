// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyCQKb8PkLNE_dHjK8F9oy7Frjr_HKpAprE",
    authDomain: "bukkode-web.firebaseapp.com",
    projectId: "bukkode-web",
    storageBucket: "bukkode-web.firebasestorage.app",
    messagingSenderId: "39704543623",
    appId: "1:39704543623:web:6e76c4319bada723ee5322",
    measurementId: "G-XVT1TN9G4E"
};

// Firebase başlatma
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Auth durum değişikliğini dinle
auth.onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('forumContent').style.display = 'block';
        loadPosts(); // Gönderileri yükle
    } else {
        // Kullanıcı giriş yapmamış
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('forumContent').style.display = 'none';
    }
});

// Kayıt olma işlemi
document.getElementById('signUpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Kayıt başarılı:', userCredential.user);
        })
        .catch((error) => {
            console.error('Kayıt hatası:', error);
            alert('Kayıt olurken bir hata oluştu: ' + error.message);
        });
});

// Giriş yapma işlemi
document.getElementById('signInForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Giriş başarılı:', userCredential.user);
        })
        .catch((error) => {
            console.error('Giriş hatası:', error);
            alert('Giriş yaparken bir hata oluştu: ' + error.message);
        });
});

// DOM elementleri
const postForm = document.getElementById('newPostForm');
const postsContainer = document.getElementById('posts');

// Yeni gönderi oluşturma
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    
    try {
        await db.collection('posts').add({
            title: title,
            content: content,
            author: auth.currentUser.uid,
            authorEmail: auth.currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            comments: []
        });
        
        postForm.reset();
        loadPosts();
    } catch (error) {
        console.error("Error adding post: ", error);
        alert('Gönderi oluşturulurken bir hata oluştu: ' + error.message);
    }
});

// Gönderileri yükleme
async function loadPosts() {
    postsContainer.innerHTML = '';
    
    try {
        const snapshot = await db.collection('posts')
            .orderBy('timestamp', 'desc')
            .get();
            
        snapshot.forEach(doc => {
            const post = doc.data();
            const postElement = createPostElement(doc.id, post);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error("Error loading posts: ", error);
        alert('Gönderiler yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Gönderi elementi oluşturma
function createPostElement(postId, post) {
    const div = document.createElement('div');
    div.className = 'card mb-4';
    div.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${post.title}</h5>
            <p class="card-text">${post.content}</p>
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    Yazan: ${post.authorEmail || 'Anonim'} - 
                    ${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Tarih yok'}
                </small>
                ${auth.currentUser?.uid === post.author ? 
                    `<button class="btn btn-danger btn-sm" onclick="deletePost('${postId}')">Sil</button>` : 
                    ''}
            </div>
            
            <!-- Yorumlar -->
            <div class="mt-3">
                <h6>Yorumlar</h6>
                <div class="comments-container">
                    ${post.comments.map(comment => `
                        <div class="comment border-bottom py-2">
                            <p class="mb-1">${comment.content}</p>
                            <small class="text-muted">
                                Yazan: ${comment.authorEmail || 'Anonim'} - 
                                ${new Date(comment.timestamp.toDate()).toLocaleString()}
                            </small>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Yeni Yorum -->
                <form class="mt-3" onsubmit="addComment(event, '${postId}')">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Yorum yaz...">
                        <button class="btn btn-primary" type="submit">Gönder</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    return div;
}

// Gönderi silme
async function deletePost(postId) {
    if (confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
        try {
            await db.collection('posts').doc(postId).delete();
            loadPosts();
        } catch (error) {
            console.error("Error deleting post: ", error);
            alert('Gönderi silinirken bir hata oluştu: ' + error.message);
        }
    }
}

// Yorum ekleme
async function addComment(e, postId) {
    e.preventDefault();
    const commentInput = e.target.querySelector('input');
    const comment = commentInput.value;
    
    if (comment.trim()) {
        try {
            const postRef = db.collection('posts').doc(postId);
            await postRef.update({
                comments: firebase.firestore.FieldValue.arrayUnion({
                    content: comment,
                    author: auth.currentUser.uid,
                    authorEmail: auth.currentUser.email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                })
            });
            
            commentInput.value = '';
            loadPosts();
        } catch (error) {
            console.error("Error adding comment: ", error);
            alert('Yorum eklenirken bir hata oluştu: ' + error.message);
        }
    }
}

// Çıkış yapma butonu ekleme
const logoutButton = document.createElement('button');
logoutButton.className = 'btn btn-danger ms-2';
logoutButton.textContent = 'Çıkış Yap';
logoutButton.onclick = () => auth.signOut();
document.querySelector('.navbar-nav').appendChild(logoutButton);

// Sayfa yüklendiğinde gönderileri yükle
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
}); 