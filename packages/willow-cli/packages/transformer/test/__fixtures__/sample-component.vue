<template>
  <div class="component">
    <button :style="buttonStyles">Click me</button>
    <div class="card">
      <h2>Card Title</h2>
      <p>Card content</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      buttonStyles: {
        backgroundColor: this.$theme.colors.primary[500],
        padding: `${this.$theme.spacing.sm} ${this.$theme.spacing.md}`,
      },
    };
  },
};
</script>

<style scoped>
.card {
  background: white;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
</style>