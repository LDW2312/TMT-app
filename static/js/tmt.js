const sequence = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7", "G", "8", "H", "9", "I", "10", "J", "11", "K", "12", "L", "13"];
let shuffled = [], current = 0, startTime = null, errors = 0;
let reactionStart = null, reactionTime = null, reactionTriggered = false, reactionActive = false;
let userName = "", userPhone = "";
let clickLog = [], correctClicks = 0, reactionTriggerIndex = null, userAge = null;

document.addEventListener("DOMContentLoaded", () => {
	const introModal = document.getElementById("intro-modal");
	const userModal = document.getElementById("user-modal");
	const resultModal = document.getElementById("result-modal");

	const area = document.getElementById("tmt-area");
	const status = document.getElementById("status");
	const userInfo = document.getElementById("user-info");
	const submitBtn = document.getElementById("submit-btn");
	const nextBtn = document.getElementById("next-btn");

	// 🔹 초기에 Intro 모달만 보이게
	introModal.style.display = "block";
	userModal.style.display = "none";
	resultModal.style.display = "none";
	
	// 설명 팝업 → 사용자 정보 입력 팝업
	nextBtn.onclick = () => {
		introModal.style.display = "none";
		userModal.style.display = "block";
	};

	// 사용자 정보 입력 후 테스트 시작
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
		// 사용자 정보 입력 팝업 숨김
		document.getElementById("user-modal").style.display = "none";
		userInfo.innerText = `👤 ${userName} / 🎂 ${userAge}세 / 📱 010-****-${phone}`;
		
		userModal.style.display = "none";
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
			{ min: 18, max: 24, avg: 48.0, std: 11.0 },
			{ min: 25, max: 34, avg: 52.0, std: 12.0 },
			{ min: 35, max: 44, avg: 58.0, std: 13.5 },
			{ min: 45, max: 54, avg: 65.0, std: 15.0 },
			{ min: 55, max: 59, avg: 70.0, std: 17.0 },
			{ min: 60, max: 64, avg: 75.0, std: 19.0 },
			{ min: 65, max: 69, avg: 82.0, std: 21.0 },
			{ min: 70, max: 74, avg: 90.0, std: 23.0 },
			{ min: 75, max: 79, avg: 105.0, std: 28.0 }
		];

		const match = ageRanges.find(r => age >= r.min && age <= r.max);
		if (!match) return "⚠️ 기준 연령대 정보 없음";

		const threshold = match.avg + 1.5 * match.std;
		let result = "";
		if (timeTaken <= match.avg) result = "🎉 매우 우수한 수행입니다!";
		else if (timeTaken <= threshold) result = "✅ 정상 범위 내 수행입니다.";
		else result = "⚠️ 수행 시간이 길어 주의가 필요합니다.";

		return `🧠 연령대: ${match.min}~${match.max}세 기준  
				🕒 수행 시간: ${timeTaken.toFixed(2)}초  
				📊 연령대 평균: ${match.avg.toFixed(2)}초 / 허용 상한: ${threshold.toFixed(2)}초  
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

			if (!reactionTriggered && ["A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7", "G", "8", "H", "9", "I", "10", "J", "11", "K", "12"].includes(value)) {
				let prob = 0.005;
				if (current >= sequence.length / 3) prob = 0.05;
				if (current >= sequence.length / 2) prob = 0.15;
				if (value === "12") prob = 1.0;
				if (Math.random() < prob) {
					reactionTriggered = true;
					reactionTriggerIndex = current;
					setTimeout(triggerReactionTest, 100 + Math.random() * 200);
				}
			}

			if (current === sequence.length) {
				const timeTaken = ((Date.now() - startTime) / 1000); // 숫자형 그대로
				const timeTakenRounded = parseFloat(timeTaken).toFixed(2);
				
				// 결과 해석
				const interpretation = interpretResult(userAge, parseFloat(timeTaken));

				// 팝업에 해석 텍스트 표시
				document.getElementById("result-text").innerText = interpretation;
				document.getElementById("result-modal").style.display = "block";

				sendResult(timeTakenRounded);
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
			age: userAge,
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
		})
	}
	// document.getElementById("close-result-btn").onclick = () => {
	// 	location.reload();  // 페이지 새로고침으로 테스트 초기화
	// };
});
