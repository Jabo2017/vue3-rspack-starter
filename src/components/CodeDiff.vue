<script setup lang="ts">
defineProps<{
  before: string
  after: string
  note?: string
  title?: string
}>()
</script>

<template>
  <article class="diff">
    <header v-if="title">
      <h3>{{ title }}</h3>
      <p v-if="note">{{ note }}</p>
    </header>
    <div class="cols">
      <div class="col old">
        <div class="tag">Vue 2</div>
        <pre><code>{{ before }}</code></pre>
      </div>
      <div class="col new">
        <div class="tag">Vue 3</div>
        <pre><code>{{ after }}</code></pre>
      </div>
    </div>
  </article>
</template>

<style scoped>
.diff {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  overflow: hidden;
}

header {
  padding: 13px 16px 11px;
  border-bottom: 1px solid var(--line);
}

h3 {
  margin: 0;
  font-size: 14px;
}

header p {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--ink-2);
}

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.col {
  min-width: 0;
  position: relative;
  padding-top: 12px;
}

.col + .col {
  border-left: 1px solid var(--line);
}

.tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: 999px;
  margin: 0 12px 8px;
  display: inline-block;
}

.old .tag {
  color: var(--warn);
  background: rgba(251, 191, 36, 0.12);
}

.new .tag {
  color: var(--ok);
  background: rgba(52, 211, 153, 0.12);
}

pre {
  margin: 0;
  padding: 0 14px 14px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ink-2);
}

.old pre {
  color: #d9c9a8;
}

.new pre {
  color: #b6e3cd;
}

@media (max-width: 720px) {
  .cols {
    grid-template-columns: 1fr;
  }

  .col + .col {
    border-left: none;
    border-top: 1px solid var(--line);
  }
}
</style>
