<?
	header('Content-Type: text/xml');
	header('Cache-Control: no-cache');
	header('Pragma: no-cache');
	header('Expires: -1');
	$now = date("U");

	$talkback[] = "Internet! Is that thing still around?";
	$talkback[] = "Ah, beer, my one weakness. My Achille's heel, if you will.";
	$talkback[] = "Okay, whatever to take my mind off my life.";
	$talkback[] = "To find Flanders, I have to think like Flanders.";
	$talkback[] = "Rock stars ... is there anything they don't know?";
	$talkback[] = "Ah, the college roadtrip. What better way to spread beer-fueled mayhem?";
	$talkback[] = "All right, brain. You don't like me and I don't like you, but let's just do this and I can get back to killing you with beer.";

	if ($_REQUEST['lastStatementID'] > count($talkback)) $_REQUEST['lastStatementID'] = 0;
?>
<ajax>
<? if (isset($_REQUEST['newState'])) { ?>
	<state code="<?=$_REQUEST['newState']?>">
		<![CDATA[
	<?
		switch($_REQUEST['newState']) {
			case 'pre':
				print "<h1>Awaiting Start Time</h1><p>This chat is scheduled for n:nn today.</p>";
				print "<!--kChat:stateButton-->";
			break;
			case 'ready':
				print "<h1>Awaiting Leader</h1><p>Leader must start chat.</p>";
				print "<!--kChat:stateButton-->";
			break;
			case 'chat':
				print "<h1>Chat in progress</h1>";
				print "<!--kChat:stateButton-->";
			break;
			case 'post':
				print "<h1>Chat Ended</h1><p>Please go away now.</p>";
				print "<!--kChat:stateButton-->";
			break;
		}
	?>
		]]>
	</state>
<? } ?>
<? if (isset($_REQUEST['statement'])) { ?>
	<statement userid="31" id="<?=$_REQUEST['lastStatementID']?>" time="<?=$now?>">
		<![CDATA[
			<?=htmlentities($_REQUEST['statement'])?>
		]]>
	</statement>
<? } else {?>
	<? if (rand(0,6) == 3) { ?>
	<statement userid="42" id="<?=$_REQUEST['lastStatementID']+1?>" time="<?=$now?>">
		<![CDATA[
			<?=$talkback[$_REQUEST['lastStatementID']]?>
		]]>
	</statement>
	<? } ?>
<? } ?>
<? if (rand(0,12) == 3) { ?>
	<userArrival name="Lisa" privilege="user" id="432" time="<?=$now?>" />
<? } ?>
<? if (rand(0,15) == 3) { ?>
	<userDeparture id="432" time="<?=$now?>" />
<? } ?>
</ajax>
