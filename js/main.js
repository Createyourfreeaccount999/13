Vue.component('task-card', {
  props: ['card'],
  template: `
    <div class="card">
      <div class="content">
        <strong>{{ card.title }}</strong><br>
        {{ card.description }}<br>
        Дэдлайн: {{ card.deadline }}<br>
        Создано: {{ card.createdAt }}<br>
        Последнее редактирование: {{ card.updatedAt }}
      </div>
      <div class="status" :style="{ color: getStatusColor(card) }">
        {{ getStatusText(card) }}
      </div>
      <div class="reason" style="color: blue;">
        {{ card.columnId === 'inProgress' && card.returnReason ? 'Причина возврата: ' + card.returnReason : '' }}
      </div>

      <button v-if="card.columnId !== 'done'" @click="$emit('edit', card)">Редактировать</button>
      <button v-if="card.columnId === 'planned'" @click="$emit('delete', card.id)">Удалить</button>
      <button v-if="card.columnId !== 'done'" @click="$emit('move', card)">Переместить</button>
      <button v-if="card.columnId === 'testing'" @click="$emit('return', card)">Вернуть</button>
    </div>
  `,
  methods: {
    getStatusText(card) {
      if (card.columnId !== 'done') return '';
      const now = new Date();
      const d = new Date(card.deadline);
      if (isNaN(d)) return 'Некорректная дата';
      return d < now ? 'Просрочено' : 'Выполнено в срок';
    },
    getStatusColor(card) {
      if (card.columnId !== 'done') return '';
      const now = new Date();
      const d = new Date(card.deadline);
      if (isNaN(d)) return 'orange';
      return d < now ? 'red' : 'green';
    }
  }
});

Vue.component('board-column', {
  props: ['column', 'cards'],
  template: `
    <div class="column">
      <h2>{{ column.name }}</h2>
      <div class="cards">
        <task-card
          v-for="card in cards"
          :key="card.id"
          :card="card"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @move="$emit('move', $event)"
          @return="$emit('return', $event)"
        />
      </div>
      <button v-if="column.id === 'planned'" @click="$emit('create', column.id)">
        Добавить карточку
      </button>
    </div>
  `
});

new Vue({
  el: '#app',
  data: {
    columns: [
      { id: 'planned', name: 'Запланированые задачи' },
      { id: 'inProgress', name: 'Задачи в работе' },
      { id: 'testing', name: 'Тестирование' },
      { id: 'done', name: 'Выполненные задачи' }
    ],
    cards: []
  },
  methods: {
    pickDate(defaultDate) {
      return new Promise(resolve => {
        const overlay = document.createElement('div');
        const dialog = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'date';
        input.value = defaultDate;
        const okButton = document.createElement('button');
        okButton.textContent = 'ОК';
        okButton.onclick = () => {
          resolve(input.value);
          document.body.removeChild(overlay);
        };
        dialog.appendChild(input);
        dialog.appendChild(okButton);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        input.focus();
      });
    },

    createCard(columnId = 'planned') {
      const title = prompt("Введите заголовок задачи:");
      if (!title) return;
      const description = prompt("Введите описание задачи:");
      this.pickDate(new Date().toISOString().slice(0, 10)).then(deadline => {
        const now = new Date().toLocaleString();
        this.cards.push({
          id: Date.now(),
          title,
          description,
          deadline,
          createdAt: now,
          updatedAt: now,
          columnId,
          returnReason: ''
        });
      });
    },
    editCard(card) {
      const newTitle = prompt("Введите новый заголовок:", card.title);
      if (newTitle) card.title = newTitle;
      const newDesc = prompt("Введите новое описание:", card.description);
      if (newDesc) card.description = newDesc;
      this.pickDate(card.deadline).then(newDeadline => {
        if (newDeadline) card.deadline = newDeadline;
        card.updatedAt = new Date().toLocaleString();
      });
    },
    deleteCard(cardId) {
      this.cards = this.cards.filter(c => c.id !== cardId);
    },
    moveCard(card) {
      if (card.columnId === 'planned') card.columnId = 'inProgress';
      else if (card.columnId === 'inProgress') card.columnId = 'testing';
      else if (card.columnId === 'testing') card.columnId = 'done';
      if (card.columnId !== 'inProgress') card.returnReason = '';
    },
    returnCard(card) {
      const reason = prompt("Укажите причину возврата:");
      if (!reason) return;
      card.returnReason = reason;
      card.columnId = 'inProgress';
    },
    getCardsByColumn(columnId) {
      return this.cards.filter(c => c.columnId === columnId);
    }
  },
  template: `
    <div class="board">
      <board-column
        v-for="column in columns"
        :key="column.id"
        :column="column"
        :cards="getCardsByColumn(column.id)"
        @create="createCard"
        @edit="editCard"
        @delete="deleteCard"
        @move="moveCard"
        @return="returnCard"
      />
    </div>
  `
});
