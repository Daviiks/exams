const appState = {
    currentMode: null, // 'practice' или 'exam'
    practice: {
        questions: [],
        currentIndex: 0,
        score: 0,
        selectedAnswers: []
    },
    exam: {
        questions: [],
        currentIndex: 0,
        selectedAnswers: [],
        timeLeft: 60 * 60,
        results: { correct: 0, wrong: 0 }
    }
};

// Загрузка вопросов из JSON
async function initApp() {
    try {
        const response = await fetch('questions.json');
        const allQuestions = await response.json();
        
        appState.practice.questions = allQuestions;
        appState.exam.questions = shuffleArray([...allQuestions]).slice(0, 40);
        
        initTheme();
        setupEventListeners();
        showScreen('mode-screen');
    } catch (error) {
        console.error('Ошибка загрузки вопросов:', error);
        alert('Не удалось загрузить вопросы. Пожалуйста, попробуйте позже.');
    }
}

function showScreen(screenId) {
    const screens = ['mode-screen', 'practice-screen', 'exam-screen', 'result-screen'];
    screens.forEach(screen => {
        document.getElementById(screen).style.display = screen === screenId ? 'block' : 'none';
    });
}

function displayQuestion() {
    const isExamMode = appState.currentMode === 'exam';
    const modeState = isExamMode ? appState.exam : appState.practice;
    const currentQuestion = modeState.questions[modeState.currentIndex];
    
    // Общие элементы для обоих режимов
    const questionElement = isExamMode 
        ? document.getElementById('exam-question-text') 
        : document.getElementById('practice-question-text');
    const optionsContainer = isExamMode 
        ? document.getElementById('exam-options-container') 
        : document.getElementById('practice-options-container');
    const nextButton = isExamMode 
        ? document.getElementById('exam-next-btn') 
        : document.getElementById('practice-next-btn');
    
    // Проверка завершения теста
    if (modeState.currentIndex >= modeState.questions.length) {
        isExamMode ? finishExam() : showPracticeResult();
        return;
    }
    
    // Установка текста вопроса
    questionElement.textContent = `${modeState.currentIndex + 1}. ${currentQuestion.question}`;
    
    // Очистка и создание вариантов ответов
    optionsContainer.innerHTML = '';
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = isExamMode ? 'option-btn' : '';
        button.onclick = () => selectAnswer(index, isExamMode);
        optionsContainer.appendChild(button);
    });
    
    // Обновление прогресса
    if (isExamMode) {
        document.getElementById('question-counter').textContent = 
            `Вопрос ${modeState.currentIndex + 1}/${modeState.questions.length}`;
    } else {
        document.getElementById('progress-counter').textContent = 
            `Вопрос ${modeState.currentIndex + 1} из ${modeState.questions.length}`;
        updateProgressBar();
    }
    
    // Сброс состояния кнопки "Далее"
    nextButton.disabled = true;
    
    // Если в режиме практики и уже есть выбранный ответ (при возврате)
    if (!isExamMode && modeState.selectedAnswers[modeState.currentIndex] !== undefined) {
        selectAnswer(modeState.selectedAnswers[modeState.currentIndex], isExamMode);
    }
}

function selectAnswer(answerIndex, isExamMode) {
    const modeState = isExamMode ? appState.exam : appState.practice;
    const currentQuestion = modeState.questions[modeState.currentIndex];
    const options = isExamMode 
        ? document.querySelectorAll('#exam-options-container button') 
        : document.querySelectorAll('#practice-options-container button');
    
    // Сброс стилей
    options.forEach(btn => {
        btn.style.backgroundColor = '';
        btn.classList.remove('selected');
    });
    
    // Если не экзамен, показываем правильный ответ
    if (!isExamMode) {
        options[currentQuestion.correctAnswer].style.backgroundColor = 'lightgreen';
        if (answerIndex !== currentQuestion.correctAnswer) {
            options[answerIndex].style.backgroundColor = 'salmon';
        }
    } else {
        options[answerIndex].classList.add('selected');
    }
    
    // Сохраняем выбранный ответ
    modeState.selectedAnswers[modeState.currentIndex] = answerIndex;
    
    // Активируем кнопку "Далее"
    const nextButton = isExamMode 
        ? document.getElementById('exam-next-btn') 
        : document.getElementById('practice-next-btn');
    nextButton.disabled = false;
    
    // Блокируем кнопки в режиме практики
    if (!isExamMode) {
        options.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        });
    }
}

function setupEventListeners() {
    // Выбор режима
    document.getElementById('practice-btn').addEventListener('click', startPracticeTest);
    document.getElementById('exam-btn').addEventListener('click', startExam);
    
    document.getElementById('practice-next-btn').addEventListener('click', handleNextQuestion);
    document.getElementById('exam-next-btn').addEventListener('click', handleNextQuestion);
    document.getElementById('early-finish-btn').addEventListener('click', confirmEarlyFinish);
    document.getElementById('practice-finish-btn').addEventListener('click', confirmPracticeFinish);
    
    // Тема
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function startPracticeTest() {
    appState.currentMode = 'practice';
    resetTest('practice');
    showScreen('practice-screen');
    displayQuestion();
}

function startExam() {
    appState.currentMode = 'exam';
    appState.exam.questions = shuffleArray([...appState.practice.questions]).slice(0, 40);
    resetTest('exam');
    showScreen('exam-screen');
    displayQuestion();
    startExamTimer();
}

let timerInterval = null; // Глобальная переменная для хранения интервала

function startExamTimer() {
    // Останавливаем предыдущий таймер, если он был
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Сбрасываем время
    appState.exam.timeLeft = 60 * 60; // 60 минут в секундах
    
    // Обновляем отображение сразу
    updateTimerDisplay();
    
    // Запускаем новый интервал
    timerInterval = setInterval(() => {
        appState.exam.timeLeft--;
        updateTimerDisplay();
        
        // Проверяем окончание времени
        if (appState.exam.timeLeft <= 0) {
            clearInterval(timerInterval);
            finishExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(appState.exam.timeLeft / 60);
    const seconds = appState.exam.timeLeft % 60;
    document.getElementById('timer').textContent = 
        `Осталось: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Не забудьте очищать интервал при выходе из экзамена
function cleanupExam() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleNextQuestion() {
    const mode = appState.currentMode;
    const state = appState[mode];
    
    // Для экзамена проверяем ответ
    if (mode === 'exam' && state.selectedAnswers[state.currentIndex] !== undefined) {
        const isCorrect = state.selectedAnswers[state.currentIndex] === 
                         state.questions[state.currentIndex].correctAnswer;
        state.results[isCorrect ? 'correct' : 'wrong']++;
    }
    
    state.currentIndex++;
    
    // Проверка завершения теста
    if (state.currentIndex >= state.questions.length) {
        if (mode === 'exam') {
            finishExam();
        } else {
            showPracticeResult();
        }
        return;
    }
    
    displayQuestion();
}

function resetTest(mode) {
    const state = appState[mode];
    state.currentIndex = 0;
    state.selectedAnswers = [];
    if (mode === 'exam') {
        state.timeLeft = 60 * 60;
        state.results = { correct: 0, wrong: 0 };
    } else {
        state.score = 0;
    }
}

function showPracticeResult() {
    const practice = appState.practice;
    let correctAnswers = 0;
    let answeredCount = 0;

    // Считаем только отвеченные вопросы
    practice.questions.forEach((question, index) => {
        if (practice.selectedAnswers[index] !== undefined) {
            answeredCount++;
            if (practice.selectedAnswers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        }
    });

    const percentage = answeredCount > 0 
        ? Math.round((correctAnswers / answeredCount) * 100)
        : 0;

    document.getElementById('result-content').innerHTML = `
        <h2>Практика завершена</h2>
        <p>Отвечено вопросов: ${answeredCount} из ${practice.questions.length}</p>
        <p>Правильных ответов: ${correctAnswers} (${percentage}%)</p>
        ${answeredCount < practice.questions.length ? 
          '<p class="hint">Вы завершили практику досрочно</p>' : ''}
        <button id="restart-btn">Вернуться к выбору режима</button>
    `;
    document.getElementById('restart-btn').addEventListener('click', () => showScreen('mode-screen'));

    showScreen('result-screen');
}

function finishExam() {
    // Остановка таймера
    cleanupExam();
    
    // Подсчет результатов (включая неотвеченные вопросы)
    const exam = appState.exam;
    for (let i = exam.currentIndex; i < exam.questions.length; i++) {
        if (exam.selectedAnswers[i] === undefined) {
            exam.results.wrong++; // Неотвеченные вопросы считаем неправильными
        }
    }
    
    showExamResult();
}

// Функция показа результатов экзамена
function showExamResult() {
    const exam = appState.exam;
    const percentage = Math.round((exam.results.correct / exam.questions.length) * 100);
    
    document.getElementById('result-content').innerHTML = `
        <h2>Экзамен завершен</h2>
        <p>Правильных ответов: ${exam.results.correct} из ${exam.questions.length}</p>
        <p>Процент выполнения: ${percentage}%</p>
        <p>${percentage >= 70 ? 'Экзамен сдан!' : 'Экзамен не сдан'}</p>
        <button id="restart-btn">Вернуться к выбору режима</button>
    `;
    document.getElementById('restart-btn').addEventListener('click', () => showScreen('mode-screen'));

    showScreen('result-screen');
}

function updateProgressBar() {
    const state = appState.practice;
    const progressPercent = (state.currentIndex / state.questions.length) * 100;
    document.getElementById('practice-progress-bar').style.width = `${progressPercent}%`;
}

function confirmEarlyFinish() {
    if (confirm("Вы уверены, что хотите завершить экзамен досрочно?\nВсе отвеченные вопросы будут проверены, а неотвеченные засчитаны как неправильные.")) {
        finishExam();
    }
}
function confirmPracticeFinish() {
    if (confirm("Завершить практику и посмотреть результаты?")) {
        showPracticeResult();
    }
}

// Функции для работы с темой
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme);
}

function updateToggleIcon(theme) {
    document.getElementById('theme-toggle').textContent = theme === 'dark' ? '🌞' : '🌙';
}

// Вспомогательная функция для перемешивания массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Запускаем приложение при загрузке страницы
window.addEventListener('DOMContentLoaded', initApp);