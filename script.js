const USER_ID = "1015356240492245054";
// iletişim bilgileri için index.html içinden değiştirmeniz gerekmekte





//==================================================================================//

const activitySection = document.getElementById("activity-section");
const usernameEl = document.getElementById("username");
const avatarEl = document.getElementById("avatar");
const statusIndicator = document.getElementById("status-indicator");
const customStatusEl = document.querySelector(".custom-status span");

const statusColors = {
  online: "online",
  idle: "idle",
  dnd: "dnd",
  offline: "offline",
};

let liveUpdateIntervals = {};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatPlayTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function updateSpotifyProgress(activityId, start, end) {
  const sanitizedId = sanitizeActivityId(activityId);
  const card = document.querySelector(`#activity-${sanitizedId}`);
  if (!card) return;

  const progressBar = card.querySelector(".progress-bar");
  const progressDot = card.querySelector(".progress-dot");
  const elapsedSpan = card.querySelector(".song-timestamps span:first-child");
  const durationSpan = card.querySelector(".song-timestamps span:last-child");

  if (!progressBar || !progressDot || !elapsedSpan || !durationSpan) return;

  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);
  const duration = Math.floor((end - start) / 1000);
  const progress = Math.min((elapsed / duration) * 100, 100);

  progressBar.style.width = `${progress}%`;
  progressDot.style.left = `${progress}%`;
  elapsedSpan.textContent = formatDuration(elapsed);
  durationSpan.textContent = formatDuration(duration);

  if (elapsed >= duration) {
    clearInterval(liveUpdateIntervals[activityId]);
    delete liveUpdateIntervals[activityId];
  }
}

function sanitizeActivityId(id) {
  return id.replace(/[:]/g, '-');
}

function startSpotifyUpdate(activity) {
  const start = activity.timestamps.start;
  const end = activity.timestamps.end;
  
  updateSpotifyProgress(activity.id, start, end);
  
  const interval = setInterval(() => {
    updateSpotifyProgress(activity.id, start, end);
  }, 1000);

  liveUpdateIntervals[activity.id] = interval;
}

function updateGameTime(activityId, start) {
  const card = document.querySelector(`#activity-${activityId}`);
  const timeEl = card?.querySelector(".game-time span");
  if (timeEl) {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    timeEl.textContent = formatPlayTime(elapsed);
  }
}

function startGameUpdate(activity) {
  const start = activity.timestamps?.start;
  if (!start) return;

  updateGameTime(activity.id, start);
  
  const interval = setInterval(() => {
    updateGameTime(activity.id, start);
  }, 1000);

  liveUpdateIntervals[activity.id] = interval;
}

function createSpotifyActivity(activity) {
  const start = activity.timestamps.start;
  const end = activity.timestamps.end;
  const duration = (end - start) / 1000;
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const percent = Math.min((elapsed / duration) * 100, 100);
  const album = activity.assets.large_image.replace("spotify:", "https://i.scdn.co/image/");
  const sanitizedId = sanitizeActivityId(activity.id);

  return `
    <div id="activity-${sanitizedId}" class="activity-card spotify">
      <div class="activity-icon"><i class="fab fa-spotify"></i></div>
      <div class="activity-content">
        <div class="song-info">
          <div class="song-title">${activity.details}</div>
          <div class="song-artist">${activity.state}</div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percent}%"></div>
          <div class="progress-dot" style="left: ${percent}%"></div>
        </div>
        <div class="song-timestamps">
          <span>${formatDuration(elapsed)}</span>
          <span>${formatDuration(duration)}</span>
        </div>
        <div class="album-art-wrapper">
          <div class="album-art-container">
            <img class="album-art" src="${album}" alt="Album Art" />
            <div class="music-bars">
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar"></div>
              <div class="bar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function createGameActivity(activity) {
  const start = activity.timestamps?.start;
  const elapsed = start ? Math.floor((Date.now() - start) / 1000) : null;
  const largeImage = activity.assets?.large_image ? convertAsset(activity.assets.large_image, "game") : "";
  const smallImage = activity.assets?.small_image ? convertAsset(activity.assets.small_image, "game") : "";
  const sanitizedId = sanitizeActivityId(activity.id);

  return `
    <div id="activity-${sanitizedId}" class="activity-card game">
      <div class="activity-icon"><i class="fas fa-gamepad"></i></div>
      <div class="activity-content">
        <div class="activity-header"><div class="activity-name">${activity.name}</div></div>
        <div class="game-details">
          ${largeImage ? `
            <div class="game-icon-container">
              <img class="game-icon" src="${largeImage}" title="${activity.assets?.large_text || ''}" />
            </div>
          ` : ""}
          <div class="game-info">
            <div class="game-title">${activity.details || "Playing"}</div>
            <div class="game-state">${activity.state || ""}</div>
            ${
              elapsed !== null
                ? `<div class="game-time"><i class="fas fa-clock"></i><span>${formatPlayTime(elapsed)}</span></div>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>`;
}

function convertAsset(imageKey, type = "large") {
  if (!imageKey) return "";
  
  if (imageKey.startsWith("mp:external/")) {
    const cut = imageKey.split("https/")[1];
    return "https://" + cut;
  }
  
  return `https://cdn.discordapp.com/app-assets/${type === "game" ? "383226320970055681" : "spotify"}/${imageKey}.png`;
}

function updateProfile(data) {
  usernameEl.textContent = data.discord_user.username;
  avatarEl.src = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=512`;
  statusIndicator.className = "status-indicator " + statusColors[data.discord_status];
  
  const customStatusActivity = data.activities?.find(activity => activity.type === 4);
  customStatusEl.textContent = customStatusActivity?.state || "No custom status";
}

function updateActivities(activities) {
  if (!activities || activities.length === 0) {
    activitySection.innerHTML = "<p style='text-align:center;color:gray;padding:20px;'>No activities</p>";
    Object.values(liveUpdateIntervals).forEach(clearInterval);
    liveUpdateIntervals = {};
    return;
  }

  Object.values(liveUpdateIntervals).forEach(clearInterval);
  liveUpdateIntervals = {};

  let html = "";
  const toLiveUpdate = [];

  activities.forEach((activity) => {
    if (activity.type === 2) {
      html += createSpotifyActivity(activity);
      toLiveUpdate.push({ activity, type: "spotify" });
    } else if (activity.type === 0) {
      html += createGameActivity(activity);
      if (activity.timestamps?.start) {
        toLiveUpdate.push({ activity, type: "game" });
      }
    }
  });

  activitySection.innerHTML = html;

  toLiveUpdate.forEach(({ activity, type }) => {
    if (type === "spotify") {
      startSpotifyUpdate(activity);
    } else if (type === "game") {
      startGameUpdate(activity);
    }
  });
}

async function fetchLanyardData(userId) {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const json = await res.json();
    if (!json.success) throw new Error("Lanyard error");
    updateProfile(json.data);
    updateActivities(json.data.activities);
  } catch (err) {
    console.error("Lanyard Error:", err);
    activitySection.innerHTML = `<p style="text-align:center;color:gray;padding:20px;">Data fetch failed.</p>`;
    Object.values(liveUpdateIntervals).forEach(clearInterval);
    liveUpdateIntervals = {};
  }
}

fetchLanyardData(USER_ID);
setInterval(() => fetchLanyardData(USER_ID), 15000);