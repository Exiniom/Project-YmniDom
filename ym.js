console.log("ym.js loaded");

function createParticles() {
  const numParticles = 30;
  const container = document.querySelector('body');

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    const size = Math.random() * 5 + 1; // Размер от 1 до 6 пикселей
    const xPos = Math.random() * 100; // Положение по оси X в процентах
    const delay = Math.random() * 10; // Задержка перед началом анимации

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${xPos}vw`;
    particle.style.animationDelay = `${delay}s`;

    container.appendChild(particle);
  }
}

document.addEventListener('DOMContentLoaded', createParticles);

const controlButtons = document.querySelectorAll('.control-button');
controlButtons.forEach(button => {
  button.addEventListener('click', () => {
    const device = button.dataset.device;
    const newState = button.dataset.state === 'off' ? 'on' : 'off';
    button.dataset.state = newState;
    button.textContent = newState === 'on' ? 'Выключить' : 'Включить';

    // Добавляем анимацию нажатия на кнопки
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 300);

    fetch(`/devices/${device}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: newState === 'on' ? 1 : 0 })
    })
    .then(response => {
      if (!response.ok) {
        console.error("Ошибка обновления состояния устройства:", response);
      }
    })
    .catch(error => {
      console.error("Ошибка сети:", error);
    });
  });
});