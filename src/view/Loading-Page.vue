<template>
  <div id="container">
    <div id="loader"></div>
  </div>
</template>
<script>
export default {};
</script>

<style scoped>
body {
  background-color: aquamarine;
}
h4 {
  position: absolute;
  bottom: 20px;
  left: 20px;
  margin: 0;
  font-weight: 200;
  opacity: 0.5;
  font-family: sans-serif;
  color: #fff;
}
#container {
  width: 70px;
  height: 35px;
  overflow: hidden;
  position: absolute;
  top: calc(50% - 17px);
  left: calc(50% - 35px);
}
#loader {
  width: 70px;
  height: 70px;
  border-style: solid;
  border-top-color: rgb(0, 0, 0);
  border-right-color: rgb(0, 0, 0);
  border-left-color: transparent;
  border-bottom-color: transparent;
  border-radius: 50%;
  box-sizing: border-box;
  animation: rotate 3s ease-in-out infinite;
  transform: rotate(-200deg);
}
@keyframes rotate {
  0% {
    border-width: 10px;
  }
  25% {
    border-width: 3px;
  }
  50% {
    transform: rotate(115deg);
    border-width: 10px;
  }
  75% {
    border-width: 3px;
  }
  100% {
    border-width: 10px;
  }
}
</style>