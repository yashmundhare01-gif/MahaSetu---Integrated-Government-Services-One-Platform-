/* MahaSetu - cleaned frontend logic */
"use strict";

const API_BASE = "backend";
let currentFontSize = 16;
let toastTimer = null;
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    bindNavigation();
    generateCaptcha();
    checkSession();
});

function $(id) {
    return document.getElementById(id);
}

function focusMain() {
    $("main-content").setAttribute("tabindex", "-1");
    $("main-content").focus();
}

function toggleMenu() {
    const menu = $("navMenu");
    const toggle = document.querySelector(".menu-toggle");
    const active = menu.classList.toggle("active");
    toggle.setAttribute("aria-expanded", String(active));
}

function bindNavigation() {
    document.querySelectorAll("#navMenu a").forEach(link => {
        link.addEventListener("click", () => {
            $("navMenu").classList.remove("active");
            document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
        });
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeModal(modal);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal.active").forEach(closeModal);
        }
    });
}

function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.active")) {
        document.body.classList.remove("modal-open");
    }
}

function openLogin() {
    closeRegister();
    generateCaptcha();
    openModal("loginModal");
    setTimeout(() => $("loginUser").focus(), 50);
}

function closeLogin() {
    closeModal($("loginModal"));
}

function openRegister() {
    closeLogin();
    $("registerForm").reset();
    openModal("registerModal");
    setTimeout(() => $("registerName").focus(), 50);
}

function closeRegister() {
    closeModal($("registerModal"));
}

function showHelp() {
    openModal("helpModal");
}

function closeHelp() {
    closeModal($("helpModal"));
}

function closeApplication() {
    closeModal($("applicationModal"));
}

function handleAuthAction() {
    if (currentUser) {
        if (confirm(`Logout ${currentUser.full_name}?`)) logoutUser();
    } else {
        openLogin();
    }
}

function generateCaptcha() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let captcha = "";
    for (let i = 0; i < 5; i++) {
        captcha += characters[Math.floor(Math.random() * characters.length)];
    }
    $("captchaText").textContent = captcha;
    $("captchaInput").value = "";
}

async function loginUser(event) {
    event.preventDefault();

    const username = $("loginUser").value.trim();
    const password = $("loginPassword").value;
    const captchaInput = $("captchaInput").value.trim().toUpperCase();
    const captchaText = $("captchaText").textContent;

    if (!username || !password) {
        showToast("Please enter your login details.");
        return;
    }
    if (captchaInput !== captchaText) {
        showToast("Invalid CAPTCHA. Please try again.");
        generateCaptcha();
        return;
    }

    try {
        const data = await apiFetch("login.php", {
            method: "POST",
            body: { identifier: username, password }
        });
        currentUser = data.user;
        updateSessionUI();
        closeLogin();
        $("loginForm").reset();
        showToast("Login successful.");
    } catch (error) {
        showToast(error.message);
        generateCaptcha();
    }
}

async function registerUser(event) {
    event.preventDefault();

    const name = $("registerName").value.trim();
    const mobile = $("registerMobile").value.trim();
    const email = $("registerEmail").value.trim();
    const password = $("registerPassword").value;
    const confirmPassword = $("registerPasswordConfirm").value;

    if (password !== confirmPassword) {
        showToast("Passwords do not match.");
        return;
    }

    try {
        const data = await apiFetch("register.php", {
            method: "POST",
            body: { full_name: name, mobile, email, password }
        });
        closeRegister();
        $("registerForm").reset();
        showToast(data.message || "Registration successful. Please login.");
        setTimeout(openLogin, 500);
    } catch (error) {
        showToast(error.message);
    }
}

async function logoutUser() {
    try {
        await apiFetch("logout.php", { method: "POST" });
    } catch (_) {
        // Session may already be expired; clear the local state anyway.
    }
    currentUser = null;
    updateSessionUI();
    showToast("You have been logged out.");
}

async function checkSession() {
    try {
        const data = await apiFetch("me.php");
        currentUser = data.user || null;
        updateSessionUI();
    } catch (_) {
        currentUser = null;
        updateSessionUI();
    }
}

function updateSessionUI() {
    const button = $("authButton");
    const user = $("sessionUser");

    if (currentUser) {
        user.hidden = false;
        user.textContent = `Hi, ${currentUser.full_name}`;
        button.textContent = "Logout";
    } else {
        user.hidden = true;
        user.textContent = "";
        button.textContent = "Login / Register";
    }
}

async function applyService(serviceId, serviceName) {
    if (!currentUser) {
        showToast("Please login before applying for a service.");
        openLogin();
        return;
    }

    $("applicationForm").reset();
    $("applicationSuccess").hidden = true;
    $("applicationServiceId").value = serviceId;
    $("selectedServiceLabel").textContent = serviceName;
    $("applicantName").value = currentUser.full_name || "";
    $("applicantMobile").value = currentUser.mobile || "";
    $("applicantEmail").value = currentUser.email || "";
    openModal("applicationModal");
    setTimeout(() => $("applicationDetails").focus(), 50);
}

async function submitApplication(event) {
    event.preventDefault();

    const payload = {
        service_id: Number($("applicationServiceId").value),
        applicant_name: $("applicantName").value.trim(),
        mobile: $("applicantMobile").value.trim(),
        email: $("applicantEmail").value.trim(),
        details: $("applicationDetails").value.trim()
    };

    try {
        const data = await apiFetch("apply.php", { method: "POST", body: payload });
        $("applicationSuccess").hidden = false;
        $("applicationSuccess").innerHTML =
            `<strong>Application submitted successfully.</strong><br>` +
            `Your Application ID is <strong>${escapeHtml(data.application_id)}</strong>.<br>` +
            `<button type="button" class="inline-btn" onclick="trackFromSuccess('${escapeJs(data.application_id)}')">Track this application</button>`;
        $("applicationForm").querySelectorAll("input, textarea, button").forEach(el => {
            if (el.type !== "button") el.disabled = true;
        });
        showToast("Application submitted.");
    } catch (error) {
        showToast(error.message);
    }
}

function trackFromSuccess(applicationId) {
    closeApplication();
    $("applicationId").value = applicationId;
    document.querySelector("#track").scrollIntoView({ behavior: "smooth" });
    trackApplication();
}

async function trackApplication() {
    const applicationId = $("applicationId").value.trim().toUpperCase();
    const result = $("trackingResult");

    if (!applicationId) {
        showToast("Please enter your application ID.");
        return;
    }

    result.innerHTML = `<div class="status-card">Loading application status...</div>`;

    try {
        const data = await apiFetch(`track.php?application_id=${encodeURIComponent(applicationId)}`);
        const history = (data.history || []).map(item =>
            `<li><strong>${escapeHtml(item.status)}</strong> — ${escapeHtml(item.remarks || "")} <span class="status-meta">(${escapeHtml(item.created_at)})</span></li>`
        ).join("");

        result.innerHTML = `
            <div class="status-card">
                <h3>${escapeHtml(data.service_name)}</h3>
                <p><strong>Application ID:</strong> ${escapeHtml(data.application_id)}</p>
                <p><strong>Department:</strong> ${escapeHtml(data.department)}</p>
                <p><strong>Status:</strong> <span class="status-badge">${escapeHtml(data.status)}</span></p>
                <p class="status-meta">Submitted: ${escapeHtml(data.created_at)}</p>
                ${history ? `<h4>Status History</h4><ul class="history">${history}</ul>` : ""}
            </div>`;
        showToast("Application status retrieved.");
    } catch (error) {
        result.innerHTML = `<div class="status-card"><strong>Application not found.</strong><p class="status-meta">${escapeHtml(error.message)}</p></div>`;
    }
}

function searchServices() {
    const input = $("serviceSearch").value.toLowerCase().trim();
    const cards = document.querySelectorAll(".service-card");
    let found = 0;

    cards.forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const match = !input || name.includes(input);
        card.hidden = !match;
        if (match) found++;
    });

    $("noServices").hidden = found !== 0;
}

function filterDepartment(department) {
    const terms = {
        Revenue: ["income", "domicile", "caste"],
        Transport: ["transport", "driving"],
        Education: ["scholarship", "education"],
        Health: ["birth", "health", "municipal"]
    };

    const matches = terms[department] || [];
    document.querySelectorAll(".service-card").forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        card.hidden = !matches.some(term => name.includes(term));
    });

    $("serviceSearch").value = department;
    $("noServices").hidden = document.querySelectorAll(".service-card:not([hidden])").length !== 0;
    document.querySelector("#services").scrollIntoView({ behavior: "smooth" });
}

function showAllServices() {
    $("serviceSearch").value = "";
    document.querySelectorAll(".service-card").forEach(card => card.hidden = false);
    $("noServices").hidden = true;
    document.querySelector("#services").scrollIntoView({ behavior: "smooth" });
}

function changeFont(amount) {
    currentFontSize = Math.max(13, Math.min(20, currentFontSize + amount));
    document.documentElement.style.fontSize = `${currentFontSize}px`;
}

function resetFont() {
    currentFontSize = 16;
    document.documentElement.style.fontSize = "16px";
}

function changeLanguage() {
    const language = $("languageSelect").value;
    if (language === "mr") {
        showToast("मराठी इंटरफेससाठी मूलभूत पर्याय निवडला आहे. Backend English field names वापरतो.");
    } else {
        showToast("English selected.");
    }
}

async function apiFetch(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: { "Accept": "application/json" }
    };

    if (options.body !== undefined) {
        config.headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, config);
    let data = {};
    try {
        data = await response.json();
    } catch (_) {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Request failed.");
    }
    return data;
}

function showToast(message) {
    const toast = $("toast");
    const messageBox = $("toastMessage");
    if (!toast || !messageBox) return;

    messageBox.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
}

function escapeJs(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
