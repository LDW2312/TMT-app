const sequence = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7", "G", "8", "H", "9", "I", "10", "J"];
let shuffled = [], current = 0, startTime = null, errors = 0;
let reactionStart = null, reactionTime = null, reactionTriggered = false, reactionActive = false;
let userName = "", userPhone = "";
let clickLog = [], correctClicks = 0, reactionTriggerIndex = null;

document.addEventListener("DOMContentLoaded", () => {
	const area = document.getElementById("tmt-area");
	const status = document.getElementById("status");
	const userInfo = document.getElementById("user-info");
	const submitBtn = document.getElementById("submit-btn");

	submitBtn.onclick = () => {
		const name = document.getElementById("name-input").value.trim();
		const phone = document.getElementById("phone-input").value.trim();
		if (!name || !phone || phone.length !== 4) {
			alert("이름과 전화번호 끝 4자리를 정확히 입력해주세요.");
			return;
		}
		userName = name;
		userPhone = `#${phone.padStart(4, "0")}`;
		document.getElementById("user-modal").style.display = "none";
		userInfo.innerText = `👤 ${userName} / 📱 010-****-${phone}`;
		resetTest();
	};

	function resetTest() {
		area.style.backgroundColor = "white";
		reactionActive = false;
		reactionTriggered = false;
		current = 0;
		errors = 0;
		correctClicks = 0;
		reactionTime = null;
		reactionTriggerIndex = null;
		startTime = null;
		clickLog = [];
		status.innerText = "";
		shuffled = sequence.slice().sort(() => Math.random() - 0.5);
		area.innerHTML = "";
		renderButtons();
	}

	function renderButtons() {
		const areaWidth = area.clientWidth;
		const areaHeight = area.clientHeight;
		const totalButtons = sequence.length;
		const buttonSize = Math.min(Math.floor(Math.sqrt((areaWidth * areaHeight) / (totalButtons * 2))), 60);
		const minDistance = buttonSize * 0.8;
		const placed = [];

		function isOverlapping(x, y) {
			return placed.some(pos => {
				const dx = pos.x - x, dy = pos.y - y;
				return Math.sqrt(dx * dx + dy * dy) < minDistance;
			});
		}

		function getNonOverlappingPosition() {
			let x, y, attempt = 0;
			do {
				x = Math.floor(Math.random() * (areaWidth - buttonSize - 10));
				y = Math.floor(Math.random() * (areaHeight - buttonSize - 10));
				attempt++;
				if (attempt > 1000) break;
			} while (isOverlapping(x, y));
			placed.push({ x, y });
			return { x, y };
		}

		shuffled.forEach(val => {
			const btn = document.createElement("button");
			btn.innerText = val;
			btn.className = "circle-btn";
			const { x, y } = getNonOverlappingPosition();
			btn.style.left = `${x}px`;
			btn.style.top = `${y}px`;
			btn.style.width = `${buttonSize}px`;
			btn.style.height = `${buttonSize}px`;
			btn.style.lineHeight = `${buttonSize}px`;
			btn.style.fontSize = `${Math.floor(buttonSize / 3)}px`;
			btn.onclick = () => handleClick(val, btn);
			area.appendChild(btn);
		});
	}

	function triggerReactionTest() {
		area.style.backgroundColor = "red";
		reactionStart = performance.now();
		reactionActive = true;
		status.innerText = "🟥돌발!! 빨간 화면을 클릭해주세요!";
	}

	function handleClick(value, btn) {
		const clickTime = performance.now();
		const isCorrect = (value.trim() === sequence[current]);

		clickLog.push({
			val: value,
			isCorrect,
			timestamp: clickTime.toFixed(1)
		});

		if (!isCorrect) errors++;

		if (reactionActive) return;
		if (current === 0) startTime = Date.now();

		if (isCorrect) {
			btn.classList.add("selected");
			current++;
			correctClicks++;

			if (!reactionTriggered && ["A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7", "G", "8", "H", "9", "I", "10"].includes(value)) {
				let prob = 0.01;
				if (current >= sequence.length / 3) prob = 0.1;
				if (current >= sequence.length / 2) prob = 0.33;
				if (value === "I") prob = 1.0;
				if (Math.random() < prob) {
					reactionTriggered = true;
					reactionTriggerIndex = current;
					setTimeout(triggerReactionTest, 100 + Math.random() * 200);
				}
			}

			if (current === sequence.length) {
				const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
				status.innerText = `✅ 완료! 시간: ${timeTaken}초 / 오류: ${errors}회 \n반응속도: ${reactionTime || '미응답'}ms`;
				sendResult(timeTaken);
			}
		}
	}

	area.addEventListener("click", (e) => {
		if (!e.target.classList.contains("circle-btn")) {
			const clickTime = performance.now();
			clickLog.push({
				val: "background",
				isCorrect: reactionActive,
				timestamp: clickTime.toFixed(1)
			});

			if (!reactionActive) errors++;
			if (reactionActive) {
				reactionTime = (clickTime - reactionStart).toFixed(2);
				area.style.backgroundColor = "white";
				status.innerText = "";
				reactionActive = false;
			}
		}
	});

	function getFirstErrorPosition(log) {
		for (let i = 0; i < log.length; i++) {
			if (!log[i].isCorrect && log[i].val !== "background") return i + 1;
		}
		return "";
	}

	function sendResult(time) {
		const reactionBackgroundClicks = clickLog.filter(
			(c) => c.val === "background" && reactionTime !== null && c.timestamp >= reactionStart
		).length;

		const validTotalClicks = clickLog.length - reactionBackgroundClicks;

		const payload = {
			name: userName,
			phone: `${userPhone.padStart(4, "0")}`,
			timestamp: new Date().toISOString(),
			time_taken: time,
			error_count: errors,
			reaction_time: reactionTime || "미응답",
			total_clicks: clickLog.length,
			accuracy: ((correctClicks / validTotalClicks) * 100).toFixed(1),
			first_click_time: clickLog[0]?.timestamp || null,
			reaction_trigger_step: reactionTriggerIndex || null,
			reaction_success: reactionTime !== null,
			total_buttons: sequence.length,
			first_error_position: getFirstErrorPosition(clickLog),
			device_type: navigator.userAgent,
			screen_resolution: `${window.innerWidth}x${window.innerHeight}`,
			completion_status: "completed",
			test_type: "TMT-B",
			click_log: clickLog
		};

		fetch('/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	}
});
