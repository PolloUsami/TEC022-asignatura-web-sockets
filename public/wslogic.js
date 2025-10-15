
// Informacion de LOGIN
/** @type {HTMLFormElement} */
const chatForm = document.querySelector("#chat-form");
/** @type {HTMLFormElement} */
const loginForm = document.querySelector("#login-form");
const appView = document.querySelector("#app");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  
  const formData = new FormData(loginForm);
  const username = formData.get("username").toString();
  
  
  beginWsConnect(username);
  
});

// Entrada de texto del chat.
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  
  const formData = new FormData(chatForm);
  const content = formData.get("content");
  
  if(currentWs === null) {
    alert("no WebSocket connectado");
    return;
  }
  
  currentWs.send(content);
  
  chatForm.reset();
  
});

document.querySelector("button#salir").onclick = () => {
  if(currentWs !== null) {
    currentWs.close();
    currentWs = null;
  }
};


function changeUI(loginSuccess) {
  if(loginSuccess) {
    appView.classList.add("flex");
    appView.classList.remove("hidden");
    loginForm.classList.add("hidden");
    loginForm.classList.remove("flex");
    
    
    document.querySelector("#client-name").innerHTML = escapeHTML(currentUsername);
  } else {
    appView.classList.remove("flex");
    appView.classList.add("hidden");
    loginForm.classList.add("flex");
    loginForm.classList.remove("hidden");
  }
}


/** @type {WebSocket | null} */
let currentWs = null;
let currentUsername = null;

function beginWsConnect(username) {
  if(currentWs !== null && currentWs.readyState < WebSocket.CLOSING) {
    currentWs.close();
  }
  
  try {
    currentWs = new WebSocket(`ws://${window.location.host}/ws?username=${encodeURIComponent(username)}`);
    currentUsername = username;
    
    
    currentWs.onmessage = (event) => {
      const action = JSON.parse(event.data);
      
      switch(action.type) {
      case "sys/ping":
        console.log("PING!");
        return;
      case "sys/alert":
        alert(action.data);
        return;
      case "chat/full":
        pushChatEntry(action.data);
        return;
      case "chat/entry":
        pushChatEntry([action.data]);
        return;
      }
      
    };
    
    currentWs.onopen = () => changeUI(true);
    currentWs.onclose = () => changeUI(false);
    
    
  } catch {
    changeUI(false);
    currentWs = null;
  }
  
}




// CODIGO GENERADO CON CHATGPT (me dio pereza)

// Global variable assumed to be defined
// let currentUsername = "YourUsername";

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafe 
 * @returns {string}
 */
function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * @param {{ id: number, content: string, username: string }[]} entries 
 */
function pushChatEntry(entries) {
  const messageList = document.querySelector("ol");

  const messages = entries.map(item => {
    const safeUsername = escapeHTML(item.username);
    const safeContent = escapeHTML(item.content);
    const isCurrentUser = safeUsername === currentUsername.toLowerCase();

    const alignmentClass = isCurrentUser ? "self-end bg-blue-100" : "self-start bg-gray-100";

    return `
      <li class="flex flex-col border-2 px-2.5 py-2 w-64 min-h-28 ${alignmentClass}">
        <span class="font-semibold">
          [${safeUsername}]:
        </span>
        <span class="text-blue-900">
          ${safeContent}
        </span>
      </li>
    `;
  });

  messageList.innerHTML += messages.join("");
}


//alert("Boo!")