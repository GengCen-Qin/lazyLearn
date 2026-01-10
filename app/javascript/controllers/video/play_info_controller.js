import { Controller } from "@hotwired/stimulus"
import { Utils } from "controllers/utils"

// Connects to data-controller="video--play-info"
export default class extends Controller {
  static targets = ["currentTime", "currentSubtitleIndex"]

  connect() {
    this.utils = new Utils();
    window.addEventListener('video:updatePlayInfo', e => this.update(e.detail));
  }

  update({ start, index, total }) {
    this.currentTimeTarget.textContent = this.utils.formatTime(start);
    this.currentSubtitleIndexTarget.textContent = `${index + 1}/${total}`;
  }
}
