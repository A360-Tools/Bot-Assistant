<template>
  <section class="page_404">
    <div class="container .prevent-select">
      <div class="row">
        <div class="col-sm-12">
          <div class="col-sm-10 col-sm-offset-1 text-center">
            <div class="four_zero_four_bg">
              <h1 class="text-center prevent-select">404</h1>
            </div>
            <div class="contant_box_404">
              <h3 class="h3 prevent-select">Unsupported Page!</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    title: String,
  },
};
</script>
<style scoped>
@font-face {
  font-family: "Museo Sans";
  font-display: auto;
  src: local("Museo Sans"), url(../assets/MuseoSans_500.woff2) format("woff2");
}

.prevent-select {
  -webkit-user-select: none;
  /* Safari */
  -ms-user-select: none;
  /* IE 10 and IE 11 */
  user-select: none;
  /* Standard syntax */
}

html {
  font-family: sans-serif;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}

body {
  margin: 0;
}

.button {
  border-radius: 14px;
}

section {
  display: block;
}

[hidden],
template {
  display: none;
}

a {
  background-color: transparent;
}

a:active,
a:hover {
  outline: 0;
}

h1 {
  margin: 0.67em 0;
  font-size: 1.5em;
}

@media print {

  *,
  :after,
  :before {
    color: #000 !important;
    text-shadow: none !important;
    background: 0 0 !important;
    -webkit-box-shadow: none !important;
    box-shadow: none !important;
  }

  a,
  a:visited {
    text-decoration: underline;
  }

  a[href]:after {
    content: " (" attr(href) ")";
  }

  a[href^="#"]:after,
  a[href^="javascript:"]:after {
    content: "";
  }

  h2,
  h3,
  p {
    orphans: 3;
    widows: 3;
  }

  h2,
  h3 {
    page-break-after: avoid;
  }
}

* {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

:after,
:before {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

html {
  font-size: 10px;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.42857143;
  color: #333;
  background-color: #fff;
}

.page_404 {
  padding: 5vh 0;
  background: #fff;
  font-family: "Arvo", serif;
}

.page_404 img {
  width: 100%;
}

.four_zero_four_bg {
  background-image: url(../assets/404.gif);
  height: 350px;
  background-position: center;
}

.four_zero_four_bg h1 {
  font-size: 80px;
}

.four_zero_four_bg h3 {
  font-size: 80px;
}

.link_404 {
  color: #fff !important;
  padding: 10px 20px;
  background: #138cde;
  margin: 20px 0;
  display: inline-block;
}

.contant_box_404 {
  margin-top: -50px;
}

a {
  color: #337ab7;
  text-decoration: none;
}

a:focus,
a:hover {
  color: #23527c;
  text-decoration: underline;
}

a:focus {
  outline: 5px auto -webkit-focus-ring-color;
  outline-offset: -2px;
}

[role="button"] {
  cursor: pointer;
}

.h1,
.h2,
.h3,
.h4,
.h5,
.h6,
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: inherit;
  font-weight: 500;
  line-height: 1.1;
  color: inherit;
}

.h1,
.h2,
.h3,
h1,
h2,
h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.h4,
.h5,
.h6,
h4,
h5,
h6 {
  margin-top: 10px;
  margin-bottom: 10px;
}

.h1,
h1 {
  font-size: 36px;
}

.h2,
h2 {
  font-size: 30px;
}

.h3,
h3 {
  font-size: 24px;
}

.h4,
h4 {
  font-size: 18px;
}

.h5,
h5 {
  font-size: 14px;
}

.h6,
h6 {
  font-size: 12px;
}

p {
  margin: 0 0 10px;
}

.text-center {
  text-align: center;
}

.container {
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 768px) {
  .container {
    width: 750px;
  }
}

@media (min-width: 992px) {
  .container {
    width: 970px;
  }
}

@media (min-width: 1200px) {
  .container {
    width: 1170px;
  }
}

.row {
  margin-right: -15px;
  margin-left: -15px;
}

.col-sm-1,
.col-sm-10,
.col-sm-11,
.col-sm-12,
.col-sm-2,
.col-sm-3,
.col-sm-4,
.col-sm-5,
.col-sm-6,
.col-sm-7,
.col-sm-8,
.col-sm-9 {
  position: relative;
  min-height: 1px;
  padding-right: 15px;
  padding-left: 15px;
}

@media (min-width: 768px) {

  .col-sm-1,
  .col-sm-10,
  .col-sm-11,
  .col-sm-12,
  .col-sm-2,
  .col-sm-3,
  .col-sm-4,
  .col-sm-5,
  .col-sm-6,
  .col-sm-7,
  .col-sm-8,
  .col-sm-9 {
    float: left;
  }

  .col-sm-12 {
    width: 100%;
  }

  .col-sm-11 {
    width: 91.66666667%;
  }

  .col-sm-10 {
    width: 83.33333333%;
  }

  .col-sm-9 {
    width: 75%;
  }

  .col-sm-8 {
    width: 66.66666667%;
  }

  .col-sm-7 {
    width: 58.33333333%;
  }

  .col-sm-6 {
    width: 50%;
  }

  .col-sm-5 {
    width: 41.66666667%;
  }

  .col-sm-4 {
    width: 33.33333333%;
  }

  .col-sm-3 {
    width: 25%;
  }

  .col-sm-2 {
    width: 16.66666667%;
  }

  .col-sm-1 {
    width: 8.33333333%;
  }

  .col-sm-offset-12 {
    margin-left: 100%;
  }

  .col-sm-offset-11 {
    margin-left: 91.66666667%;
  }

  .col-sm-offset-10 {
    margin-left: 83.33333333%;
  }

  .col-sm-offset-9 {
    margin-left: 75%;
  }

  .col-sm-offset-8 {
    margin-left: 66.66666667%;
  }

  .col-sm-offset-7 {
    margin-left: 58.33333333%;
  }

  .col-sm-offset-6 {
    margin-left: 50%;
  }

  .col-sm-offset-5 {
    margin-left: 41.66666667%;
  }

  .col-sm-offset-4 {
    margin-left: 33.33333333%;
  }

  .col-sm-offset-3 {
    margin-left: 25%;
  }

  .col-sm-offset-2 {
    margin-left: 16.66666667%;
  }

  .col-sm-offset-1 {
    margin-left: 8.33333333%;
  }

  .col-sm-offset-0 {
    margin-left: 0;
  }
}

@-webkit-keyframes progress-bar-stripes {
  from {
    background-position: 40px 0;
  }

  to {
    background-position: 0 0;
  }
}

@-o-keyframes progress-bar-stripes {
  from {
    background-position: 40px 0;
  }

  to {
    background-position: 0 0;
  }
}

@keyframes progress-bar-stripes {
  from {
    background-position: 40px 0;
  }

  to {
    background-position: 0 0;
  }
}

.container:after,
.container:before,
.row:after,
.row:before {
  display: table;
  content: " ";
}

.container:after,
.row:after {
  clear: both;
}</style>

