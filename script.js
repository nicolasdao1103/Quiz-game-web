document.addEventListener('DOMContentLoaded', () =>{
    const questionContainer = document.getElementById('question');   
    const answersContainer = document.getElementById('answers');   
    const resultContainer = document.getElementById('result'); 
    const progressContainer = document.getElementById('progress');   
    const currentScoreDisplay = document.getElementById('currentScore');   
    const highScoreDisplay = document.getElementById('highScore');   
    const gameSetupDiv = document.getElementById('game-setup');   
    const quizDiv = document.getElementById('quiz');   
    const categorySelect = document.getElementById('category');   
    const amountInput = document.getElementById('amount');   
    const difficultySelect = document.getElementById('difficulty');   
    const startButton = document.getElementById('start-btn'); 
    const timerContainer = document.getElementById('timer');
    
    let currentQuestions = [];
    let score = 0;
    let questionIndex = 0;
    let highScore = parseInt(localStorage.getItem('HighScoreTrivia')) || 0;
    let questionStartTime;
    let timerInterval;
    const baseScorePerQuestion = 1000;
    const penaltyPerSecond = 10;
    const defaultTime = 100;

    highScoreDisplay.innerText = `High Score: ${highScore}`;

    function fetchCategories(){
        fetch('https://opentdb.com/api_category.php').then(response => response.json()).then(data => {
            data.trivia_categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });        
        });
    }

    function startGame(){
        const category = categorySelect.value;
        const amount = amountInput.value;
        const difficulty = difficultySelect.value;
        fetchQuestions(amount, category, difficulty);
        gameSetupDiv.style.display = 'none';
        quizDiv.style.display = 'block';
    }

    function fetchQuestions(amount, category, difficulty){
        let url = `https://opentdb.com/api.php?amount=${amount}`;
        if (category) url += `&category=${category}`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        url += `&type=multiple`;

        fetch(url).then(response => response.json()).then(data =>{
            currentQuestions = data.results;
            questionIndex = 0;
            score = 0;
            displayQuestion();
        }).catch(error => alert('Error:' + error));
    }

    function displayQuestion(){
        clearInterval(timerInterval);
        timerContainer.innerText = '';

        if(questionIndex < currentQuestions.length){
            let currentQuestion = currentQuestions[questionIndex];
            questionContainer.innerHTML = decodeHTML(currentQuestion.question);
            displayAnswers(currentQuestion);
            updateProgress();
            startTimer();
            questionStartTime = Date.now();
        }else{
            updateHighScore();
            showResults();
        }
    }

    function displayAnswers(question){
        answersContainer.innerHTML = '';
        const answers = [...question.incorrect_answers, question.correct_answer];
        shuffleArray(answers);

        answers.forEach(answer =>{
            const button = document.createElement('button');
            button.innerHTML = decodeHTML(answer);
            button.className = 'answer-btn';
            button.addEventListener('click', () => selectAnswer(button, question.correct_answer, answers));
            answersContainer.appendChild(button);
        });
    }

    function selectAnswer(selectedButton, correctAnswer, answers){
        clearInterval(timerInterval);

        const timeTaken = (Date.now() - questionStartTime) / 1000;
        let scoreForThisQuestion = Math.max(baseScorePerQuestion - Math.floor(timeTaken) * penaltyPerSecond, 0);

        disableButtons();
        let correctButton;
        answers.forEach(answer => {
            if (decodeHTML(answer) === decodeHTML(correctAnswer)){
                correctButton = [...answersContainer.childNodes].find(button => button.innerHTML === decodeHTML(correctAnswer));
            }
        });

        if(decodeHTML(selectedButton.innerHTML) === decodeHTML(correctAnswer)){
            score += scoreForThisQuestion;
            selectedButton.classList.add('correct');
            resultContainer.innerText = `Correct! + ${scoreForThisQuestion} Points`;
        }else{
            selectedButton.classList.add('incorrect');
            correctButton.classList.add('correct');
            resultContainer.innerText = `Wrong! The correct answer was: ${decodeHTML(correctAnswer)}`;
        }

        updateCurrentScore();
        setTimeout(() => {
            questionIndex++;
            displayQuestion();
            resultContainer.innerText = ''; 
        }, 3000);

    }

    function startTimer(){
        let timeRemaining = defaultTime;
        timerContainer.innerText = `Time left: ${timeRemaining}s`

        timerInterval = setInterval(() => {
            timeRemaining--;
            timerContainer.innerText = `Time left: ${timeRemaining}s`

            if (timeRemaining <=0){
                clearInterval(timerInterval);
                autoSelectWrongAnswer();
            }
        }, 1000);
    }

    function autoSelectWrongAnswer(){
        const correctAnswer = currentQuestions[questionIndex].correct_answer;
        const buttons = answersContainer.getElementsByClassName('answer-btn');
        for (let button of buttons){
            if(decodeHTML(button.innerHTML) === decodeHTML(correctAnswer)){
                button.classList.add('correct');
            } else {
                button.classList.add('incorrect');
            }
            button.disabled = true;
        }

        resultContainer.innerText = `Time is up! The correct answer was: ${decodeHTML(correctAnswer)}`;
        setTimeout(() => {
            questionIndex++;
            displayQuestion();
        }, 3000);
    }

    function updateCurrentScore(){
        currentScoreDisplay.innerText = `Current Score: ${score}`;
    }

    function disableButtons(){
        const buttons = answersContainer.getElementsByClassName('answer-btn');
        for(let button of buttons){
            button.disabled = true;
        }
    }

    function showResults(){
        clearInterval(timerInterval);
        questionContainer.innerText = 'Quiz Finished!';
        answersContainer.innerHTML = '';
        resultContainer.innerText = `Your final score is: ${score}`;
        updateHighScoreDisplay();
        progressContainer.innerText = '';
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Quiz';
        restartButton.addEventListener('click', () => {
            quizDiv.style.display = 'none';
            gameSetupDiv.style.display = 'block';
            fetchCategories()
        });
        answersContainer.appendChild(restartButton);
    }

    function updateHighScore(){
        if(score > highScore){
            highScore = score
            localStorage.setItem('HighScoreTrivia', highScore.toString());
            updateHighScoreDisplay(); 
        }
    }

    function updateHighScoreDisplay (){
       highScoreDisplay.innerText = `High Score: ${highScore}`
    }

    function updateProgress(){
        progressContainer.innerText = `Question 
        ${questionIndex + 1}/${currentQuestions.length}`;
    }

    function shuffleArray(array){
        for(let i = array.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function decodeHTML(html){
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }


    startButton.addEventListener('click', startGame);

    fetchCategories();


});