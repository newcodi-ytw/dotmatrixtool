var matrix;
var $table;
var rowMajor = false;
var msbendian = false;
var bitmapObjects = new Map();

$(function() {
	matrix = createArray(8, 5);
  	updateTable();
	initOptions();

	$('#_output').hide();
	$('#imgName').val(1);
});

function updateTable() {
	var width = matrix[0].length;
	var height = matrix.length;

	$('#_grid').html('');
	$('#_grid').append(populateTable(null, height, width, matrix));

	// Add 'disabled-cell' class to the last row
	$('#_grid tr:last-child td').addClass('disabled-cell');

	// Add 'disabled-cell' class to the last column only if width is 48
	if (width === 48) {
		$('#_grid tr td:last-child').addClass('disabled-cell');
	}

	// Event listeners, applying the same conditions as before
	let selector = "td:not(tr:last-child td)";
	if (width === 48) {
		selector += ":not(:last-child)";
	}
	$table.on("mousedown", selector, toggle);
	$table.on("mouseenter", selector, toggle);
	$table.on("dragstart", function() { return false; });
}
function downloadTableImage() {
    const table = $('#_grid')[0];

    // Create a temporary wrapper with padding for the table
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';            // Adjust padding as needed
    wrapper.style.backgroundColor = '#333';    // Optional: set a background color for the padding
    
    // Specify desired width and height
	let width = matrix[0].length;
	let height = matrix.length;
    let desiredWidth = 400; // Set your desired width
    let desiredHeight = 400;  // Set your desired height
	if(width == 48)
	{
		desiredWidth = 800;
	}

    // Set explicit size for the wrapper to match desired dimensions
    wrapper.style.width = desiredWidth + 'px';
    wrapper.style.height = desiredHeight + 'px';
    wrapper.style.overflow = 'hidden'; // Prevent overflow

	wrapper.style.display = 'flex';
	wrapper.style.alignItems = 'center'; // Vertically center
	wrapper.style.justifyContent = 'center'; // Horizontally center

	// console.log(desiredWidth, desiredHeight);
	// console.log(wrapper.style.width, wrapper.style.height);

    // Move the table inside the wrapper
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);

    // Capture the table with padding
    html2canvas(wrapper, {
        width: desiredWidth,
        height: desiredHeight,
        scale: 1 // Optional: increases the resolution of the image
    }).then(canvas => {
        // Restore table to original position
        wrapper.parentNode.insertBefore(table, wrapper);
        wrapper.remove();

        const dataURL = canvas.toDataURL("image/png");
        // Create a new anchor element for the image
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "image_data_" + $('#imgName').val() + ".png"; // Use a unique name for each image

        // Append the link to the body (not displayed)
        document.body.appendChild(link);
        // Trigger the download
        link.click();
        // Clean up by removing the link
        document.body.removeChild(link);

        // Remove the border after capturing
        table.style.border = ''; // Clear the border style
        return dataURL;
    });
}


function initOptions() {
	$('#clearButton').click(function() { 
		matrix = createArray(matrix.length,matrix[0].length); 
		updateTable(); 
		// $('#_output').hide();
	});

	$('#generateButton').click(updateCode);
	
	$('#readButton').click(readData);

	$('#donwloadButton').click(downloadTableImage);
	
	$('#imgName').click(function () {
		$('#imgName').select();
	});

	// Add the enter key event
	$('#imgName').keydown(function (event) {
		if (event.keyCode === 13) {
			// Code to execute when the enter key is pressed
			// updateCode();
			bitmapObjects.forEach((value, key) => {
				const dataURL = value[1]; // This should be the image data URL

				// Create a new anchor element for each image
				const link = document.createElement("a");
				link.href = dataURL;
				link.download = "image_data_" + key + ".png"; // Use a unique name for each image

				// Append the link to the body (not displayed)
				document.body.appendChild(link);

				// Trigger the download
				link.click();

				// Clean up by removing the link
				document.body.removeChild(link);
			})
		}
	});

	 $('#widthDropDiv li a').click(function () {
	 	var width = parseInt($(this).html());
		if(width == 5)
		{
			matrix = createArray(8, width);
		}
		else if(width == 48)
		{
			matrix = createArray(16, width);
		}
        // matrix = createArray(height, width);
        updateTable();
        updateSummary();
		$('#widthDrop').title = width;
     });

     $('#heightDropDiv li a').click(function () {
	 	// var width = matrix[0].length;
	 	var height = parseInt($(this).html());
		if(height == 8)
		{
			matrix = createArray(height, 5);
		}
		else if(height == 16)
		{
			matrix = createArray(height, 48);
		}
        // matrix = createArray(height, width);
        updateTable();
        updateSummary();
     });

     $('#byteDropDiv li a').click(function () {
	 	var selection = $(this).html();
        rowMajor = selection.startsWith("Row");  
        updateSummary();      	
     });

     $('#endianDropDiv li a').click(function () {
	 	var selection = $(this).html();
        msbendian = selection.startsWith("Big");  
        updateSummary();      	
     });

     updateSummary();
}

function updateSummary() {
	var width = matrix[0].length;
	var height = matrix.length;
	var summary = width + "px * " + height + "px | ";

	if (rowMajor) summary += "row major | ";
	else summary += "column major | ";

	if (msbendian) summary += "big endian.";
	else summary += "little endian.";

	$('#_summary').html(summary);
}

function updateCode() {
	$('#_output').show();
	var data = generateByteArray();
	var bytes = data[0];
	// var bytes_TM1680 = data[1];

	var maxtrixData = "DotMatrixImg data" + $('#imgName').val();
	maxtrixData += " = {\n";
	maxtrixData += "\t.data = {" + bytes + "},\n";
	maxtrixData += "\t.h = " + matrix.length + ",\n";
	maxtrixData += "\t.w = " + matrix[0].length + ",\n";
	maxtrixData += "};";

	bitmapObjects.set($('#imgName').val(), maxtrixData);

	var displayText = "";
	bitmapObjects.forEach((value, key) => {
		displayText += value + "\n";
	})

	$('#_output').html("\n"+displayText);
	$('#_output').removeClass('prettyprinted');
	prettyPrint();

	addCopyButton(displayText);
}

function addCopyButton(resultText) {
	const copyButtonLabel = "Copy Code";
	// use a class selector if available
	let blocks = document.querySelectorAll("pre");

	blocks.forEach((block) => {
		// only add button if browser supports Clipboard API
		if (navigator.clipboard) {
			let button = document.createElement("button");

			button.innerText = copyButtonLabel;
			block.appendChild(button);

			button.addEventListener("click", async () => {
				await copyCode(resultText, button);
			});
		}
	});

	async function copyCode(resultText, button) {
		await navigator.clipboard.writeText(resultText);
		// visual feedback that task is completed
		button.innerText = "Code Copied";
		setTimeout(() => {
		  button.innerText = copyButtonLabel;
		}, 700);
	}
}

function readData() {
	var testData = "0x3e, 0x7f, 0x41, 0x09, 0x41, 0x19, 0x41, 0x29, 0x22, 0x46, 0x00, 0x00, 0x7f, 0x7f, 0x08, 0x49, 0x08, 0x49, 0x08, 0x49, 0x7f, 0x49, 0x00, 0x00, 0x7c, 0x7c, 0x0a, 0x0a, 0x09, 0x09, 0x0a, 0x0a, 0x7c, 0x7c, 0x00, 0x00, 0x7f, 0x7f, 0x09, 0x41, 0x19, 0x41, 0x29, 0x41, 0x46, 0x3e, 0x00, 0x00, 0x3e, 0x01, 0x41, 0x02, 0x41, 0x7c, 0x49, 0x02, 0x3a, 0x01, 0x00, 0x00, 0x7f, 0x00, 0x49, 0x00, 0x49, 0x5f, 0x49, 0x00, 0x49, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0xe0, 0x00, 0xf8, 0x00, 0xfe, 0x3f, 0x80, 0x0f, 0x80, 0x03, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00";
	var bytestr = prompt("Input your data here, in hex format: 0x1, 0x2", testData);
	if (!bytestr) return;
	var width = matrix[0].length;
	var height = matrix.length;

	var bytes = bytestr.split(',').map(function (x) { return parseInt(x) });

	var byteinarow = Math.ceil(width / 8);
	var byteinacol = Math.ceil(height / 8);
	var byteindex;
	var bitindex;
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			if (rowMajor) {
				byteindex = y * byteinarow + Math.floor(x / 8);
				bitindex = x % 8;
			} else {
				byteindex = x * byteinacol + Math.floor(y / 8);
				bitindex = y % 8;
			}
			if (msbendian) bitindex = 7 - bitindex;
			matrix[y][x] = (bytes[byteindex] >> bitindex) & 0x1;
		}
	}
	updateTable();
	updateSummary();
	// updateCode();
}


function generateByteArray() {
	var width = matrix[0].length;
	var height = matrix.length;
	var buffer = new Array(width * height);
	var bytes = new Array((width * height) / 8);
	var bytes_TM1680 = new Array((width * height) / 8);

	// Column Major
	var temp;
	for (var x = 0; x < width; x++) {
		for (var y = 0; y < height; y++) {
			temp = matrix[y][x];
			if (!temp) temp = 0;
			// Row Major or Column Major?
			if (!rowMajor) {
				buffer[x * height + y] = temp;	
			}
			else {
				buffer[y * width + x] = temp;
			}
			
		}
	}

	// Read buffer 8-bits at a time
	// and turn it into bytes
	for (var i = 0; i < buffer.length; i+=8) {
		var newByte = 0;
		for (var j = 0; j < 8; j++) {
            if (buffer[i+j]) {
            	if (msbendian) {
                	newByte |= 1 << (7-j);
                }
                else {
                	newByte |= 1 << j;
                }
            }
        }
        bytes_TM1680[i / 8] = (newByte >> 4) | (newByte << 4);
        bytes[i / 8] = newByte;
	}

	var formatted = bytes.map(function (x) {
	    x = x + 0xFFFFFFFF + 1;  // twos complement
	    x = x.toString(16); // to hex
	    x = ("0"+x).substr(-2); // zero-pad to 8-digits
	    x = "0x" + x;
	    return x;
	}).join(', ');

	var formatted_TM1680 = bytes_TM1680.map(function (x, idx) {
	    x = x + 0xFFFFFFFF + 1;  // twos complement
	    x = x.toString(16); // to hex
	    x = ("0"+x).substr(-2); // zero-pad to 8-digits
	    x = "0x" + x;

		// if(idx == width) x = x + "\n\n\n"
	    return x;
	}).join(', ');

	return [formatted, formatted_TM1680];
}

function toggle(e) {
	var x = $(this).data('i');
	var y = $(this).data('j');

	if (e.buttons == 1 && !e.ctrlKey) {
		matrix[x][y] = 1;
		$(this).addClass('on');		
	}
	else if (e.buttons == 2 || (e.buttons == 1 && e.ctrlKey)) {			
		matrix[x][y] = 0;
		$(this).removeClass('on');	
	}

	return false;
}

function populateTable(table, rows, cells, content) {
    if (!table) table = document.createElement('table');
    for (var i = 0; i < rows; ++i) {
        var row = document.createElement('tr');
        for (var j = 0; j < cells; ++j) {
            row.appendChild(document.createElement('td'));
            $(row.cells[j]).data('i', i);
            $(row.cells[j]).data('j', j);
			if (content[i][j]) {
				$(row.cells[j]).addClass('on');
			}
        }
        table.appendChild(row);
    }
    $table = $(table);
    return table;
}

// (height, width)
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}