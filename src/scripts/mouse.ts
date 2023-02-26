import { ref, onMounted, onUnmounted } from 'vue'

export function useClick() {
  const click = ref(false)

  function down() {
    click.value = true
  }

  function up() {
    click.value = false
  }
  onMounted(() => {
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
  })
  onUnmounted(() => {
    window.removeEventListener('mousedown', down)
    window.removeEventListener('mouseup', up)
  })
  return click
}

export function usePosition() {
  const x = ref(0)
  const y = ref(0)

  function update(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => {
    window.addEventListener('mousemove', update)
  })
  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })
  return { x, y }
}
