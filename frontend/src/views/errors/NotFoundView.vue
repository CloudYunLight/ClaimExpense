<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面不存在或已被移除</p>
    <router-link :to="{ name: 'dashboard' }">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 1rem;
}

h1 {
  font-size: 4rem;
  margin: 0;
}

a {
  color: var(--brand-primary);
  text-decoration: underline;
}
</style>
