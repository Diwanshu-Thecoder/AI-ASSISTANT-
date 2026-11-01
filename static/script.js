// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const chatArea = document.getElementById("chatArea");

const welcomeScreen = document.getElementById("welcomeScreen");
const currentMode = document.getElementById("currentMode");
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeDescription = document.getElementById("welcomeDescription");
const emailSummarySection = document.getElementById("emailSummarySection");
const inputSection = document.querySelector(".input-section");

const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const fileInput = document.getElementById("fileInput");
const attachFileBtn = document.getElementById("attachFileBtn");
const attachmentList = document.getElementById("attachmentList");

const sidebar = document.querySelector(".sidebar");
const menuBtn = document.getElementById("menuBtn");


// ==========================================
// 2. APPLICATION STATE
// ==========================================

let selectedMode = "chat";
let isSending = false;
let selectedFiles = [];

// Stores messages in the currently open conversation
let conversationHistory = [];

// Stores the SQLite ID of the currently open conversation
let currentConversationId = null;


// ==========================================
// 3. ASSISTANT MODES
// ==========================================

const modes = {
    chat: {
        name: "General Chat",
        title: "How can I help you today?",
        description:
            "Ask questions, explore ideas, or get help with your work."
    },

    summarizer: {
        name: "Summarizer",
        title: "Let's simplify your text.",
        description:
            "Paste a paragraph, article, or notes to get a concise summary."
    },

    coding: {
        name: "Coding Assistant",
        title: "Let's solve a coding problem.",
        description:
            "Ask programming questions, understand code, or debug errors."
    },

    study: {
        name: "Study Assistant",
        title: "What are you learning today?",
        description:
            "Understand difficult concepts with simple explanations and examples."
    }
};


// ==========================================
// 4. CREATE THE CHAT HISTORY SECTION
// ==========================================

const historySection = document.createElement("div");

historySection.id = "conversationHistorySection";

historySection.style.cssText = `
    margin-top: 24px;
    padding: 0 9px;
    overflow-y: auto;
    max-height: 45vh;
`;

const historyHeading = document.createElement("h4");

historyHeading.textContent = "Recent Chats";

historyHeading.style.cssText = `
    margin: 0 0 8px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--muted);
    text-transform: uppercase;
`;

const historyList = document.createElement("div");

historyList.id = "conversationHistoryList";

historySection.append(historyHeading, historyList);


// Place the history section in the sidebar
if (sidebar) {
    const sidebarBottom = sidebar.querySelector(
        ".sidebar-bottom, .sidebar-footer"
    );

    if (sidebarBottom) {
        sidebar.insertBefore(historySection, sidebarBottom);
    } else if (newChatBtn) {
        newChatBtn.insertAdjacentElement("afterend", historySection);
    } else {
        sidebar.appendChild(historySection);
    }
}


// ==========================================
// 5. SELECT AN ASSISTANT MODE
// ==========================================

function showChatWorkspace() {
    currentMode.textContent = modes[selectedMode].name;
    emailSummarySection.hidden = true;
    chatArea.hidden = false;
    inputSection.hidden = false;

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.mode === selectedMode
        );
    });
}

function selectEmailSummaries() {
    currentMode.textContent = "Email Summaries";
    emailSummarySection.hidden = false;
    chatArea.hidden = true;
    inputSection.hidden = true;

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === "email-summary"
        );
    });

    if (sidebar) {
        sidebar.classList.remove("open");
    }
}

function selectMode(mode) {
    if (!modes[mode]) {
        return;
    }

    selectedMode = mode;

    welcomeTitle.textContent = modes[mode].title;
    welcomeDescription.textContent = modes[mode].description;
    showChatWorkspace();

    // Starting another mode starts a separate conversation
    startNewChat();

    if (sidebar) {
        sidebar.classList.remove("open");
    }
}


// Attach click events to the mode buttons
document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        if (button.dataset.view === "email-summary") {
            selectEmailSummaries();
        } else {
            selectMode(button.dataset.mode);
        }
    });
});


// ==========================================
// 6. START A NEW CHAT
// ==========================================

function startNewChat() {
    showChatWorkspace();
    messages.replaceChildren();
    selectedFiles = [];
    renderAttachmentList();

    conversationHistory = [];

    // null means the first message will create a new database record
    currentConversationId = null;

    welcomeScreen.style.display = "block";

    messageInput.value = "";
    messageInput.style.height = "auto";

    messageInput.focus();
}


// New Chat button
newChatBtn.addEventListener("click", startNewChat);


// ==========================================
// 7. SUGGESTION CARDS
// ==========================================

document.querySelectorAll(".suggestion-card").forEach(card => {
    card.addEventListener("click", () => {
        messageInput.value = card.dataset.prompt;

        messageInput.focus();

        messageInput.style.height = "auto";

        messageInput.style.height =
            Math.min(messageInput.scrollHeight, 150) + "px";
    });
});


// ==========================================
// 8. RESIZE THE MESSAGE INPUT
// ==========================================

messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(messageInput.scrollHeight, 150) + "px";
});


// ==========================================
// 9. ENTER TO SEND A MESSAGE
// ==========================================

messageInput.addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

function renderAttachmentList() {
    attachmentList.replaceChildren();

    selectedFiles.forEach((file, index) => {
        const chip = document.createElement("div");
        chip.className = "attachment-chip";

        const name = document.createElement("span");
        name.textContent = file.name;
        name.title = file.name;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.disabled = isSending;
        removeButton.setAttribute("aria-label", `Remove ${file.name}`);
        removeButton.addEventListener("click", () => {
            selectedFiles.splice(index, 1);
            renderAttachmentList();
        });

        chip.append(name, removeButton);
        attachmentList.appendChild(chip);
    });
}

attachFileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    const totalBytes = files.reduce((total, file) => total + file.size, 0);

    if (files.length > 5) {
        alert("Choose up to 5 files at a time.");
        fileInput.value = "";
        return;
    }

    if (totalBytes > 10 * 1024 * 1024) {
        alert("Keep all uploaded files together under 10 MB.");
        fileInput.value = "";
        return;
    }

    selectedFiles = files;
    renderAttachmentList();
    fileInput.value = "";
});


// ==========================================
// 10. DISPLAY A MESSAGE
// ==========================================

function addMessage(role, content, isTyping = false, attachmentNames = []) {
    const message = document.createElement("div");

    message.className = `message ${role}`;

    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent = role === "user" ? "Y" : "✦";

    const body = document.createElement("div");

    body.className = "message-body";

    if (isTyping) {
        const typing = document.createElement("div");

        typing.className = "typing";

        for (let i = 0; i < 3; i++) {
            typing.appendChild(
                document.createElement("span")
            );
        }

        body.appendChild(typing);

    } else if (role === "assistant") {
        // Render Markdown safely
        const safeHTML = DOMPurify.sanitize(
            marked.parse(content || "")
        );

        body.innerHTML = safeHTML;

    } else {
        // User messages are displayed as plain text
        body.textContent = content;

        if (attachmentNames.length) {
            const attachmentGroup = document.createElement("div");
            attachmentGroup.className = "message-attachments";

            attachmentNames.forEach(name => {
                const attachment = document.createElement("span");
                attachment.className = "message-attachment";
                attachment.textContent = `📎 ${name}`;
                attachmentGroup.appendChild(attachment);
            });

            body.appendChild(attachmentGroup);
        }
    }

    message.append(avatar, body);

    messages.appendChild(message);

    chatArea.scrollTop = chatArea.scrollHeight;

    return message;
}


// ==========================================
// 11. LOAD SAVED CONVERSATIONS
// ==========================================

async function loadConversationList() {
    const conversationList = document.getElementById(
        "conversationHistoryList"
    );

    if (!conversationList) return;

    conversationList.replaceChildren();

    try {
        const response = await fetch("/conversations");

        if (!response.ok) {
            throw new Error("Could not load conversations.");
        }

        const conversations = await response.json();

        if (!conversations.length) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No previous chats";
            emptyMessage.style.fontSize = "13px";
            emptyMessage.style.opacity = "0.7";

            conversationList.appendChild(emptyMessage);
            return;
        }

        conversations.forEach((conversation) => {
            // Create a row for each conversation
            const row = document.createElement("div");

            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.gap = "5px";
            row.style.marginBottom = "5px";

            // Button to open the conversation
            const openButton = document.createElement("button");
            // Rename button
const renameButton = document.createElement("button");

renameButton.type = "button";
renameButton.textContent = "✎";
renameButton.title = "Rename conversation";
renameButton.setAttribute(
    "aria-label",
    `Rename conversation: ${conversation.title}`
);

renameButton.style.width = "32px";
renameButton.style.height = "32px";
renameButton.style.flexShrink = "0";
renameButton.style.border = "none";
renameButton.style.borderRadius = "6px";
renameButton.style.cursor = "pointer";
renameButton.style.background = "transparent";
renameButton.style.color = "inherit";
renameButton.style.fontSize = "16px";

renameButton.addEventListener("click", async (event) => {
    event.stopPropagation();

    const newTitle = prompt(
        "Enter a new conversation title:",
        conversation.title
    );

    if (newTitle === null) return;

    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
        alert("Conversation title cannot be empty.");
        return;
    }

    if (trimmedTitle.length > 100) {
        alert("Title cannot exceed 100 characters.");
        return;
    }

    if (trimmedTitle === conversation.title) return;

    renameButton.disabled = true;

    try {
        const response = await fetch(
            `/conversation/${encodeURIComponent(conversation.id)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: trimmedTitle
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Could not rename conversation."
            );
        }

        await loadConversationList();

    } catch (error) {
        console.error("Rename error:", error);
        alert(error.message || "Could not rename conversation.");
    } finally {
        renameButton.disabled = false;
    }
});
            openButton.type = "button";
            openButton.textContent = conversation.title;
            openButton.title = conversation.title;

            openButton.style.flex = "1";
            openButton.style.minWidth = "0";
            openButton.style.overflow = "hidden";
            openButton.style.textOverflow = "ellipsis";
            openButton.style.whiteSpace = "nowrap";
            openButton.style.textAlign = "left";
            openButton.style.padding = "9px";
            openButton.style.border = "none";
            openButton.style.borderRadius = "6px";
            openButton.style.cursor = "pointer";
            openButton.style.background = "transparent";
            openButton.style.color = "inherit";

            openButton.addEventListener("click", () => {
                openConversation(conversation.id);
            });

            // Delete button
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete conversation";
            deleteButton.setAttribute(
                "aria-label",
                `Delete conversation: ${conversation.title}`
            );

            deleteButton.style.width = "32px";
            deleteButton.style.height = "32px";
            deleteButton.style.flexShrink = "0";
            deleteButton.style.border = "none";
            deleteButton.style.borderRadius = "6px";
            deleteButton.style.cursor = "pointer";
            deleteButton.style.background = "transparent";
            deleteButton.style.color = "inherit";
            deleteButton.style.fontSize = "20px";

            deleteButton.addEventListener("click", async (event) => {
                event.stopPropagation();

                const confirmed = confirm(
                    `Delete "${conversation.title}"?\n\nThis will permanently delete the conversation and its messages.`
                );

                if (!confirmed) return;

                deleteButton.disabled = true;

                try {
                    const deleteResponse = await fetch(
                        `/conversation/${encodeURIComponent(conversation.id)}`,
                        {
                            method: "DELETE"
                        }
                    );

                    const result = await deleteResponse.json();

                    if (!deleteResponse.ok) {
                        throw new Error(
                            result.error || "Could not delete conversation."
                        );
                    }

                    // If the deleted chat is currently open,
                    // return to the New Chat screen.
                    if (
                        String(currentConversationId) ===
                        String(conversation.id)
                    ) {
                        currentConversationId = null;
                        conversationHistory = [];
                        messages.replaceChildren();

                        if (welcomeScreen) {
                            welcomeScreen.style.display = "";
                        }
                    }

                    // Refresh the sidebar without reloading the page
                    await loadConversationList();

                } catch (error) {
                    console.error("Delete error:", error);
                    alert(error.message || "Could not delete conversation.");
                } finally {
                    deleteButton.disabled = false;
                }
            });

            row.appendChild(openButton);
            row.appendChild(renameButton);
            row.appendChild(deleteButton);

            conversationList.appendChild(row);
        });

    } catch (error) {
        console.error("Conversation loading error:", error);

        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Could not load previous chats.";
        conversationList.appendChild(errorMessage);
    }
}


// ==========================================
// 12. OPEN AN EXISTING CONVERSATION
// ==========================================

async function openConversation(conversationId) {
    if (isSending) {
        return;
    }

    try {
        showChatWorkspace();

        const response = await fetch(
            `/conversation/${encodeURIComponent(conversationId)}`
        );

        if (!response.ok) {
            throw new Error("Could not open this conversation.");
        }

        const savedMessages = await response.json();

        // Set the active conversation ID
        currentConversationId = conversationId;
        selectedFiles = [];
        renderAttachmentList();

        // Clear the currently displayed conversation
        messages.replaceChildren();

        // Hide the welcome screen
        welcomeScreen.style.display = "none";

        // Restore conversation history
        conversationHistory = [];

        savedMessages.forEach(item => {
            if (
                !["user", "assistant"].includes(item.role) ||
                typeof item.text !== "string"
            ) {
                return;
            }

            // Display the saved message
            addMessage(item.role, item.text);

            // Restore history for Gemini follow-up questions
            conversationHistory.push({
                role: item.role,
                text: item.text
            });
        });

        // Keep the latest 20 messages in browser memory
        conversationHistory = conversationHistory.slice(-20);

        // Refresh the selected item in the sidebar
        await loadConversationList();

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        messageInput.focus();

    } catch (error) {
        console.error("Error opening conversation:", error);

        alert(
            "Could not load this conversation. Please try again."
        );
    }
}


// ==========================================
// 13. SEND A MESSAGE TO FLASK
// ==========================================

async function sendMessage(text, files = [...selectedFiles]) {
    if (isSending || (!text.trim() && !files.length)) {
        return;
    }

    isSending = true;

    sendBtn.disabled = true;
    attachFileBtn.disabled = true;
    renderAttachmentList();

    welcomeScreen.style.display = "none";

    // Display the user's message
    const attachmentNames = files.map(file => file.name);
    addMessage(
        "user",
        text || "Please analyze these files.",
        false,
        attachmentNames
    );

    messageInput.value = "";
    messageInput.style.height = "auto";

    // Display typing animation
    const typingMessage = addMessage(
        "assistant",
        "",
        true
    );

    try {
        const payload = {
            message: text,
            mode: selectedMode,
            history: conversationHistory,
            conversation_id: currentConversationId
        };
        let body = JSON.stringify(payload);
        const headers = {"Content-Type": "application/json"};

        if (files.length) {
            const formData = new FormData();
            formData.append("message", text);
            formData.append("mode", selectedMode);
            formData.append("history", JSON.stringify(conversationHistory));
            if (currentConversationId !== null) {
                formData.append("conversation_id", currentConversationId);
            }
            files.forEach(file => formData.append("files", file, file.name));
            body = formData;
            delete headers["Content-Type"];
        }

        const response = await fetch("/chat", {
            method: "POST",
            headers,
            body
        });

        const data = await response.json();

        // Remove the typing animation
        typingMessage.remove();

        if (!response.ok) {
            throw new Error(
                data.error || "Something went wrong."
            );
        }

        // Store the ID returned by Flask
        if (data.conversation_id !== undefined) {
            currentConversationId = data.conversation_id;
        }

        // Display Gemini's response
        const reply = data.reply || "No response generated.";

        addMessage("assistant", reply);
        selectedFiles = [];
        renderAttachmentList();

        // Store the exchange in browser memory
        conversationHistory.push(
            {
                role: "user",
                text: data.user_message || text
            },
            {
                role: "assistant",
                text: reply
            }
        );

        // Keep the latest 20 messages
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        // Refresh the sidebar to show the new conversation
        await loadConversationList();

    } catch (error) {
        typingMessage.remove();

        addMessage(
            "assistant",
            error.message ||
                "Unable to connect to the server. Please try again."
        );

        console.error("Chat error:", error);

    } finally {
        isSending = false;

        sendBtn.disabled = false;
        attachFileBtn.disabled = false;
        renderAttachmentList();

        messageInput.focus();
    }
}


// ==========================================
// 14. HANDLE FORM SUBMISSION
// ==========================================

chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = messageInput.value.trim();

    sendMessage(text);
});


// ==========================================
// 15. MOBILE SIDEBAR
// ==========================================

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}


// ==========================================
// 16. LOAD CHAT HISTORY WHEN THE PAGE OPENS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadConversationList();

    if (new URLSearchParams(window.location.search).get("section") === "email-summary") {
        selectEmailSummaries();
    }
});