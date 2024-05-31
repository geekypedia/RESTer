	<?php
	
	error_reporting(E_ERROR | E_PARSE);
	
	header('Content-Type: text/css');
	
	
	$file = __DIR__.'/../app/config/settings.js';
	$contents = file_get_contents($file);
	//$config = json_decode($contents);
	$start =  strpos($contents, "theme") - 1;
	$midstr = substr($contents, $start);
	$end = strpos($midstr, "}") + 1;
	$finalstr = substr($midstr, 0, $end);
	$finaljsonstr = "{ " . $finalstr . "}";
	$finaljson = (array)json_decode($finaljsonstr);

	$bg = $finaljson['theme']->background;
	$css = "
.page-link, .btn-primary{
	background-color: " . $bg . " !important;
}

.btn-link{
	color: " . $bg . " !important;
}
";
	
	
	$scriptFile = "additional.css";
	$fp = fopen($scriptFile, 'w'); 
	fwrite($fp, $css);
	fclose($fp);
	
	echo $css;
	?>
