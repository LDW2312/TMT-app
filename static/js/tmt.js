const sequence = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7", "G", "8", "H", "9", "I", "10", "J"];
let shuffled = [], current = 0, startTime = null, errors = 0;
let reactionStart = null, reactionTime = null, reactionTriggered = false, reactionActive = false;
let userName = "", userPhone = "";
let clickLog = [], correctClicks = 0, reactionTriggerIndex = null, userAge = null;

document.addEventListener("DOMContentLoaded", () => {
	const area = document.getElementById("tmt-area");
	const status = document.getElementById("status");
	const userInfo = document.getElementById("user-info");
	const submitBtn = document.getElementById("submit-btn");

	submitBtn.onclick = () => {
		const name = document.getElementById("name-input").value.trim();
		const phone = document.getElementById("phone-input").value.trim();
		const age = parseInt(document.getElementById("age-input").value.trim());
		if (!name || !phone || phone.length !== 4 || isNaN(age)) {
		alert("이름, 나이, 전화번호를 모두 정확히 입력해주세요.");
		return;
	}
		userName = name;
		userAge = age;
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
		const subtitle = document.getElementById("subtitle");
		subtitle.innerText = "Trail Making Test (Part B)";
		subtitle.style.color = "#777";
		subtitle.style.fontSize = "0.9em";
		subtitle.style.fontWeight = "normal";
		subtitle.style.backgroundColor = "transparent";
		subtitle.style.padding = "0";
		subtitle.style.borderRadius = "0";
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

	function interpretResult(age, timeTaken) {
		const ageRanges = [
			{ min: 20, max: 29, avg: 59.03, std: 18.97 },
			{ min: 30, max: 39, avg: 62.11, std: 17.73 },
			{ min: 40, max: 49, avg: 71.75, std: 20.52 },
			{ min: 50, max: 59, avg: 79.23, std: 25.31 },
			{ min: 60, max: 69, avg: 94.28, std: 30.25 },
			{ min: 70, max: 79, avg: 110.73, std: 33.12 }
		];

		const match = ageRanges.find(r => age >= r.min && age <= r.max);
		if (!match) return "⚠️ 기준 연령대 정보 없음";

		const threshold = match.avg + 1.5 * match.std;
		let result = "";
		if (timeTaken <= match.avg) result = "🎉 매우 우수한 수행입니다!";
		else if (timeTaken <= threshold) result = "✅ 정상 범위 내 수행입니다.";
		else result = "⚠️ 수행 시간이 길어 주의가 필요합니다.";

		return `🧠 연령대: ${match.min}~${match.max}세 기준  
	🕒 수행 시간: ${timeTaken.toFixed(1)}초  
	📊 기준 평균: ${match.avg.toFixed(1)}초 / 허용 상한: ${threshold.toFixed(1)}초  
	${result}`;
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
				
				// 기존 하단 상태 메시지 제거
				status.innerText = "";

				// 부제목 위치에 한 줄 결과 표시
				const subtitle = document.getElementById("subtitle");
				subtitle.innerText = `✅ 완료! 시간: ${time}초 / 오류: ${errors}회 / 반응속도: ${reactionTime || '미응답'}ms`;
				subtitle.style.color = "#1976d2";  // 파란색 강조
				subtitle.style.fontSize = "1.2em";
				subtitle.style.fontWeight = "bold";
				subtitle.style.backgroundColor = "#e3f2fd";  // 연한 배경
				subtitle.style.padding = "6px";
				subtitle.style.borderRadius = "6px";

				sendResult(timeTaken);

				const interpretation = interpretResult(userAge, timeTaken);

				status.innerText = interpretation;
				status.style.color = "#336699";  // 진한 파랑 계열 강조
				status.style.fontWeight = "bold";
				status.style.whiteSpace = "pre-line"; // 줄바꿈 허용

				sendResult(timeTaken.toFixed(2));
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

		function toKSTISOString() {
			const kst = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST = UTC+9
			return kst.toISOString().replace("T", " ").slice(0, 19); // "YYYY-MM-DD HH:MM:SS"
		}

		const payload = {
			name: userName,
			phone: `${userPhone.padStart(4, "0")}`,
			timestamp: toKSTISOString(),
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
