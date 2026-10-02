(() => {
  "use strict";

  const list = document.getElementById("messageList");
  const status = document.getElementById("messagesStatus");
  const refresh = document.getElementById("refreshMessages");
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || "";

  if (!list || !status || !refresh || !csrf) return;

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const setLoading = (loading) => {
    refresh.disabled = loading;
    list.setAttribute("aria-busy", String(loading));
  };

  const makeMessageCard = (message) => {
    const article = document.createElement("article");
    article.className = "message-item";
    article.dataset.id = String(message.id);

    const top = document.createElement("div");
    top.className = "message-item-top";

    const identity = document.createElement("div");
    identity.className = "message-identity";

    const name = document.createElement("strong");
    name.textContent = typeof message.name === "string" ? message.name : "Anonymous";

    const time = document.createElement("time");
    const timestamp = typeof message.created_at === "string" ? message.created_at : "";
    time.dateTime = timestamp;
    time.textContent = timestamp || "Unknown time";

    identity.append(name, time);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-message";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete message from ${name.textContent}`);
    deleteButton.addEventListener("click", () => deleteMessage(message.id, article, deleteButton));

    top.append(identity, deleteButton);

    const body = document.createElement("p");
    body.className = "message-item-body";
    body.textContent = typeof message.message === "string" ? message.message : "";

    article.append(top, body);
    return article;
  };

  async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      return { response, data };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function loadMessages() {
    setLoading(true);
    setStatus("Loading messages…");

    try {
      const { response, data } = await fetchJson("../php/get-messages.php", {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (response.status === 401) {
        window.location.href = "login.php";
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Messages could not be loaded.");
      }

      const messages = Array.isArray(data.data) ? data.data : [];
      const fragment = document.createDocumentFragment();
      messages.forEach((message) => fragment.appendChild(makeMessageCard(message)));
      list.replaceChildren(fragment);

      setStatus(messages.length ? `${messages.length} message${messages.length === 1 ? "" : "s"} loaded.` : "No messages yet.", messages.length ? "success" : "");
    } catch (error) {
      list.replaceChildren();
      const message = error?.name === "AbortError"
        ? "The request timed out. Please try again."
        : error instanceof Error
          ? error.message
          : "Messages could not be loaded.";
      setStatus(message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(id, article, button) {
    if (!window.confirm("Delete this birthday message? This cannot be undone.")) return;

    button.disabled = true;
    setStatus("Deleting message…");

    try {
      const { response, data } = await fetchJson("../php/delete-message.php", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        body: JSON.stringify({ id })
      });

      if (response.status === 401) {
        window.location.href = "login.php";
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.error || "The message could not be deleted.");
      }

      article.remove();
      setStatus(list.children.length ? "Message deleted." : "No messages yet.", "success");
    } catch (error) {
      button.disabled = false;
      const message = error?.name === "AbortError"
        ? "The delete request timed out."
        : error instanceof Error
          ? error.message
          : "The message could not be deleted.";
      setStatus(message, "error");
    }
  }

  refresh.addEventListener("click", loadMessages);
  loadMessages();
})();
