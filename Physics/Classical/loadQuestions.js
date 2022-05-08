let questions = {};
let quesStraight = [];
let quesInclined = [];
let question0 = 'A constant force acting on a body of mass 3.0 kg changes its speed from 2.0 m s<sup>-1</sup> to 3.5 m s<sup>-1</sup> in 25 s. The direction of the motion of the body remains unchanged. What is the magnitude and direction of the force ?';
let question1 = 'The driver of a three-wheeler moving with a speed of 36 km/h sees a child standing in the middle of the road and brings his vehicle to rest in 4.0 s just in time to save the child. What is the average retarding force on the vehicle? The mass of the three-wheeler is 400 kg and the mass of the driver is 65 kg';
let question2 = 'A constant retarding force of 50 N is applied to a body of mass 20 kg moving initially with a speed of 15 ms<sup>-1</sup>. How long does the body take to stop ?';
quesStraight.push(question0);
quesStraight.push(question1);
quesStraight.push(question2);

let quesI0 = 'A mass of 5 kg rests on a horizontal plane. The plane is gradually inclined until at an angle θ = 15° with the horizontal, the mass just begins to slide. What is the coefficient of static friction between the block and the surface ?';
let quesI1 = 'question 2';
let quesI2 = 'question 3';
let quesI3 = 'question 4';
let quesI4 = 'question 5';
			
quesInclined.push(quesI0, quesI1, quesI2, quesI3, quesI4);
questions['Straight'] = quesStraight;
questions['Inclined'] = quesInclined;

const buttonNextEl = document.getElementById( 'next-el' );
buttonNextEl.addEventListener('click', function ()	{
    quesnochange()
});	

function quesnochange() {
	let num = document.getElementById('next-el').getAttribute('href');
	let sceneText = document.getElementById('scene-el').innerText;
	let i = +num;
	console.log(i, sceneText)
	if ( i <  questions[sceneText].length-1 ) {
		document.getElementById('next-el').setAttribute('href', i+1)
					
		return changeQuestion( sceneText, i )
	} else  {
		document.getElementById('next-el').setAttribute('href', 0)

		return changeQuestion( sceneText, i )
	}
}	

function changeQuestion( sceneText, a ) {
				
	document.getElementById('message-el').innerHTML = questions[sceneText][a];

}
			// function changeQuestion( a ) {
				
			// 	document.getElementById('message-el').innerHTML = quesInclined[a];

			// }
			