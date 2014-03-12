<!doctype html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!-->
<html class="no-js" lang="fr"> <!--<![endif]-->
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title></title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width">
    <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->
    <link rel="stylesheet" href="<%- URL_REQUEST %>/styles/bootstrap.css">
    <link rel="stylesheet" href="<%- URL_REQUEST %>/styles/font-awesome/css/font-awesome.css">
    <link rel="stylesheet" href="<%- URL_REQUEST %>/styles/treeView.css">
    <link rel="stylesheet" href="<%- URL_REQUEST %>/styles/animate.css">
    <link rel="stylesheet" href="<%- URL_REQUEST %>/styles/step.css">
    <!-- <link href="<%- URL_REQUEST %>/bower_components/ui.bootstrap/bootstrap.css" rel="stylesheet"> -->
    <link rel="stylesheet" href="<%- URL_REQUEST %>/styles/main.css">
</head>
<body ng-app="cnedApp" key-trap class="body-home">
    <!--[if lt IE 7]>
    <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->
    <!--[if lt IE 9]>
    <script src="<%- URL_REQUEST %>/bower_components/es5-shim/es5-shim.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/json3/lib/json3.min.js"></script>
    <![endif]-->
    <!-- Add your site or application content here -->
    <div class="container" ng-view=""></div>
    <div class="no-show">A</div>
    <!-- Google Analytics: change UA-XXXXX-X to be your site's ID -->
    <script>
    /*(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', 'UA-XXXXX-X');
    ga('send', 'pageview');*/
    </script>
    <script src="<%- URL_REQUEST %>/bower_components/jquery/jquery.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/angular/angular.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/underscore/underscore.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/ui.bootstrap/ui-bootstrap-tpls-0.9.0.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/jqueryUI/jquery-ui.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/jqueryUI/jquery.mjs.nestedSortable.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/affix.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/alert.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/button.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/carousel.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/transition.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/collapse.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/dropdown.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/modal.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/scrollspy.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/tab.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/tooltip.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/sass-bootstrap/js/popover.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/angular-resource/angular-resource.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/angular-cookies/angular-cookies.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/angular-sanitize/angular-sanitize.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/angular-route/angular-route.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/angular-gettext/dist/angular-gettext.min.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/ckeditor/ckeditor.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/jcrop/js/jquery.Jcrop.min.js"></script>
    <link rel="stylesheet" href="<%- URL_REQUEST %>/bower_components/jcrop/css/jquery.Jcrop.min.css">
    <script src="<%- URL_REQUEST %>/bower_components/audiojs/audio.min.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/hyphenator/Hyphenator.js"></script>
    <script src="<%- URL_REQUEST %>/bower_components/hyphenator/patterns/fr.js"></script>
    <!-- <link rel="stylesheet" href="<%- URL_REQUEST %>/bower_components/audiojs/index.css"> -->
    <!-- build:js({.tmp,app}) <%- URL_REQUEST %>/scripts/front.js -->
    <script src="scripts/app.js"></script>
    <script src="scripts/translations.js"></script>
    <script src="scripts/services/helpers.js"></script>
    <script src="scripts/services/config.js"></script>
    <script src="scripts/controllers/index/main.js"></script>
    <script src="scripts/controllers/common/common.js"></script>
    <script src="scripts/controllers/workspace/images.js"></script>
    <script src="scripts/controllers/tag/tag.js"></script>
    <script src="scripts/controllers/workspace/apercu.js"></script>
    <script src="scripts/controllers/profiles/profiles.js"></script>
    <script src="scripts/controllers/ttsTest/ttsTest.js"></script>
    <script src="scripts/controllers/passport/passport.js"></script>
    <script src="scripts/directives/imgCropped.js"></script>
    <script src="scripts/directives/ckeditor.js"></script>
    <script src="scripts/directives/treeView.js"></script>
    <script src="scripts/directives/keyup.js"></script>
    <script src="scripts/directives/showTab.js"></script>
    <script src="scripts/directives/bodyClasses.js"></script>
    <script src="scripts/directives/regleStyle.js"></script>
    <script src="scripts/directives/regleStylePlan.js"></script>
    <!-- endbuild -->
</body>
</html>