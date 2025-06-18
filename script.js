let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswerIndex = null;
const progressCounter = document.getElementById('progress-counter');

// Загрузка вопросов из JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить вопросы');
        }
        questions = await response.json();
        displayQuestion();
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('question').textContent = 'Ошибка загрузки вопросов. Пожалуйста, обновите страницу.';
    }
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showResult();
        return;
    }
    updateProgressBar();
    progressCounter.textContent = `Вопрос ${currentQuestionIndex + 1} из ${questions.length}`;
    selectedAnswerIndex = null; 
    

    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextButton = document.getElementById('next-button');
    const currentQuestion = questions[currentQuestionIndex];

    questionElement.textContent = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;
    optionsElement.innerHTML = '';

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => selectAnswer(index);
        optionsElement.appendChild(button);
    });
    optionsElement.disabled = false;
    nextButton.disabled = true;
}

function selectAnswer(answerIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const options = document.querySelectorAll('#options button');
    
    options[currentQuestion.correctAnswer].style.backgroundColor = 'lightgreen';
    
    if (answerIndex === currentQuestion.correctAnswer) {
        score++;
    } else {
        options[answerIndex].style.backgroundColor = 'salmon';
    }

    selectedAnswerIndex = answerIndex; // Сохраняем выбор
    document.getElementById('next-button').disabled = false;
    options.forEach(btn => {
        btn.disabled = true; // Блокируем все кнопки
        btn.style.opacity = '1';
        btn.style.color = '#333';
        btn.style.cursor = 'not-allowed';
    });
}

document.getElementById('next-button').addEventListener('click', () => {
    currentQuestionIndex++;
    displayQuestion();
});

function updateProgress() {
    const progress = (currentQuestionIndex / questions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

function showResult() {
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = `
        <h2>Тест завершен!</h2>
        <p>Ваш результат: ${score} из ${questions.length}</p>
        <button onclick="location.reload()">Пройти тест снова</button>
    `;
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('next-button').style.display = 'none';
}

const themeToggle = document.getElementById('theme-toggle');

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
    themeToggle.textContent = theme === 'dark' ? '🌞' : '🌙';
}

function updateProgressBar() {
    const progressPercent = (currentQuestionIndex / questions.length) * 100;
    document.querySelector('.progress').style.width = `${progressPercent}%`;
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    themeToggle.addEventListener('click', toggleTheme);
});

// Запускаем загрузку вопросов при загрузке страницы
window.onload = loadQuestions;