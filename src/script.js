const stage = document.querySelector(".name-stage");
const lockup = document.querySelector(".name-lockup");

let isDragging = false;
let previousX = 0;
let previousY = 0;
let tiltX = 0;
let tiltY = 0;
let twist = 0;
let settleFrame = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function updateTransform() {
  lockup.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
  lockup.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
  lockup.style.setProperty("--twist", `${twist.toFixed(2)}deg`);
}

function settle() {
  tiltX *= 0.92;
  tiltY *= 0.92;
  twist *= 0.9;
  updateTransform();

  if (Math.abs(tiltX) + Math.abs(tiltY) + Math.abs(twist) > 0.2) {
    settleFrame = requestAnimationFrame(settle);
  }
}

stage.addEventListener("pointerdown", (event) => {
  isDragging = true;
  previousX = event.clientX;
  previousY = event.clientY;
  lockup.classList.add("is-dragging");
  stage.setPointerCapture(event.pointerId);
  cancelAnimationFrame(settleFrame);
});

stage.addEventListener("pointermove", (event) => {
  if (!isDragging) {
    return;
  }

  const deltaX = event.clientX - previousX;
  const deltaY = event.clientY - previousY;
  previousX = event.clientX;
  previousY = event.clientY;

  tiltY = clamp(tiltY + deltaX * 0.18, -34, 34);
  tiltX = clamp(tiltX - deltaY * 0.18, -24, 24);
  twist = clamp(twist + deltaX * 0.018, -5, 5);
  updateTransform();
});

function releaseDrag(event) {
  if (!isDragging) {
    return;
  }

  isDragging = false;
  lockup.classList.remove("is-dragging");

  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }

  settle();
}

stage.addEventListener("pointerup", releaseDrag);
stage.addEventListener("pointercancel", releaseDrag);
