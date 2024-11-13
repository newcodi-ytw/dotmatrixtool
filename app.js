var matrix;
var $table;
var scanFullFrame = false;
var rowMajor = false;
var msbendian = false;
var bitmapObjects = new Map();

const disabledRow = 1;
const disabledCol = 48;

let inputImageDataField = "static Image_t large_N = {(uint8_t[]){0xff, 0x01, 0x08, 0x00, 0x10, 0x00, 0x20, 0x00, 0xff, 0x01}, {5, 9}};";

$(function() {
	updateRangeHtmlOptions_WH();

	matrix = createArray(16, 48);
  	updateTable();
	initOptions();

	$('#_output').hide();
});

function updateRangeHtmlOptions_WH() {
	const dropdownMenuH = document.querySelector('#heightDropDiv .dropdown-menu');
	const dropdownMenuW = document.querySelector('#widthDropDiv .dropdown-menu');

	for (let index = 1; index <= 48; index++) {
		const newListItem = document.createElement('li');
		const newLink = document.createElement('a');
		newLink.href = '#';
		newLink.textContent = index;
		// Add the link to the list item
		newListItem.appendChild(newLink);
		// Add the list item to the unordered list
		dropdownMenuW.appendChild(newListItem);
	}

	for (let index = 1; index <= 16; index++) {
		const newListItem = document.createElement('li');
		const newLink = document.createElement('a');
		newLink.href = '#';
		newLink.textContent = index;
		// Add the link to the list item
		newListItem.appendChild(newLink);
		// Add the list item to the unordered list
		dropdownMenuH.appendChild(newListItem);
	}
}

function updateTable() {
	var width = matrix[0].length;
	var height = matrix.length;

	$('#_grid').html('');
	$('#_grid').append(populateTable(null, height, width, matrix));

	if (disabledRow && height >= 8) {
		// Add 'disabled-cell' class to the last row
		$('#_grid tr:last-child td').addClass('disabled-cell');
	}
	if (disabledCol && disabledCol === width) {
		// Add 'disabled-cell' class to the last column only if width is 48
		$('#_grid tr td:last-child').addClass('disabled-cell');
	}

	let selector = '';
	// Event listeners, applying the same conditions as before
	if (disabledRow && height >= 8) {
		selector += "td:not(tr:last-child td)";
	} else {
		selector = 'td';
	}
	if (disabledCol && disabledCol === width) {
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
	if(width >= disabledCol)
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
        link.download = "Image_" + $('#input_imageFilename').val() + ".png"; // Use a unique name for each image

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

function resizeMatrix(oldMatrix, newHeight, newWidth) {
    const newMatrix = createArray(newHeight, newWidth);
	
	let minHeight = Math.min(oldMatrix.length, newHeight);
    for (let i = 0; i < minHeight; i++) {
		let minWidth = Math.min(oldMatrix[i].length, newWidth);
        for (let j = 0; j < minWidth; j++) {
			if(i === minHeight - 1 || (j === minWidth - 1 && minWidth === disabledCol)) {
				newMatrix[i][j] = 0;	
			} else {
				newMatrix[i][j] = oldMatrix[i][j];
			}
        }
    }

    return newMatrix;
}

function initOptions() {
	$('#clearButton').click(function() { 
		matrix = createArray(matrix.length, matrix[0].length); 
		updateTable();
		bitmapObjects = new Map();
		$('#_output').hide();
	});

	$('#generateButton').click(updateCode);
	
	$('#readButton').click(readData);

	$('#donwloadButton').click(downloadTableImage);
	
	$('#input_imageFilename').click(function () {
		$('#input_imageFilename').select();
	});

	function roundUpTo8(v) {
		return ((v + 7) & ~7);
	}

	$('#widthDropDiv li a').click(function () {
		var width = parseInt($(this).html());
		var height = matrix.length;
		if ((width * height) % 8 != 0){
			height = roundUpTo8(matrix.length);
		}
		matrix = resizeMatrix(matrix, height, width);

		updateTable();
		updateSummary();
	});

	$('#heightDropDiv li a').click(function () {
		var width = matrix[0].length;
		var height = parseInt($(this).html());
		if ((width * height) % 8 != 0){
			width = roundUpTo8(matrix[0].length);
		}
		matrix = resizeMatrix(matrix, height, width);

		updateTable();
		updateSummary();
     });

	$('#fullImageDropDiv li a').click(function () {
		var selection = $(this).html();
		scanFullFrame = selection.startsWith("All");

		var selectedText = $(this).text(); // Get the text of the clicked option
		$("#fullImageDrop").text(selectedText + ' ').append('<span class="caret"></span>'); // Update the button text
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
	var width = data[2];
	var height = data[3];
	
	// var width = matrix[0].length;
	// var height = matrix.length;
	
	// var bytes_TM1680 = data[1];

	// var maxtrixData = "static Image_t data" + $('#input_imageFilename').val();

	// var maxtrixData = "static Image_t " + $('#input_imageFilename').val();
	// maxtrixData += " = {\n";
	// maxtrixData += "\t.data = (uint8_t[]){" + bytes + "},\n";
	// maxtrixData += "\t.size = {\n";
	// maxtrixData += "\t\t.w = " + width + ",\n";
	// maxtrixData += "\t\t.h = " + height + ",\n";
	// maxtrixData += "\t}\n";
	// maxtrixData += "};";

	var maxtrixData = "static Image_t " + $('#input_imageFilename').val();
	maxtrixData += " = {(uint8_t[]){" + bytes + "}, ";
	maxtrixData += "{" + width + ", "+ height + "}};";

	bitmapObjects = new Map();

	bitmapObjects.set($('#input_imageFilename').val(), maxtrixData);

	var displayText = "";
	bitmapObjects.forEach((value, key) => {
		displayText += value;
	})

	$('#_output').html("\n"+displayText);
	$('#_output').removeClass('prettyprinted');
	prettyPrint();

	navigator.clipboard.writeText(displayText);

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
	var inputdata = prompt("Input your data here, in hex format: 0x1, 0x2", inputImageDataField);
	if (!inputdata) return;

	matrix = createArray(matrix.length, matrix[0].length); 
	updateTable();
	bitmapObjects = new Map();
	$('#_output').hide();

	var image_name = null;
	var image_bytes = null;
	var image_width = null;
	var image_height = null;
	var width = matrix[0].length;
	var height = matrix.length;

	// Regular expressions to capture each part
	var nameMatch = inputdata.match(/static Image_t (\w+)/);
	var bytesMatch = inputdata.match(/\{(0x[0-9a-fA-F]{2}(, 0x[0-9a-fA-F]{2})*)\}/);
	var sizeMatch = inputdata.match(/\{(\d+), (\d+)\}/);

	if (nameMatch && bytesMatch && sizeMatch) {
		image_name = nameMatch[1];
		image_bytes = bytesMatch[1];
		image_width = sizeMatch[1];
		image_height = sizeMatch[2];

		width = image_width;
		height = image_height;

		$('#input_imageFilename').val(image_name);

		console.log("image_name:", image_name);
		console.log("image_bytes:", image_bytes);
		console.log("image_width:", image_width);
		console.log("image_height:", image_height);
	} else {
		console.log("Error: Could not parse the string");

		return;
	}

	var bytes = image_bytes.split(',').map(function (x) { return parseInt(x) });

	// if(height>8) height = 16;

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
	// var buffer = new Array(width * height);
	// var bytes = new Array((width * height) / 8);
	// var bytes_TM1680 = new Array((width * height) / 8);

	// Column Major
	var maxWidth = 0;
	var maxHeight = 0;
	var imageRealWidth = 0;
	var imageRealHeight = 0;

	if (scanFullFrame) {
		maxWidth = width;
		maxHeight = height;
	}
	else {
		//search for the boundaries
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {
				var temp = matrix[y][x];
				if (x > maxWidth && temp == 1)
					maxWidth = x;
				if (y > maxHeight && temp == 1)
					maxHeight = y;
			}
		}

		if (maxWidth == 0 && maxHeight == 0) {
			maxWidth = width;
			maxHeight = height;
		} else {
			maxWidth += 1;
			maxHeight += 1;
		}
	}

	function roundUpTo8(v) {
		return ((v + 7) & ~7);
	}

	imageRealWidth = maxWidth;
	imageRealHeight = maxHeight;

	maxHeight = roundUpTo8(maxHeight);

	let buffer = new Array(maxWidth * maxHeight);
	let bytes = new Array((maxWidth * maxHeight) / 8);
	let bytes_TM1680 = new Array((maxWidth * maxHeight) / 8);

	for (var x = 0; x < maxWidth; x++) {
		for (var y = 0; y < maxHeight; y++) {
			var temp = matrix[y][x];

			if (!temp) temp = 0;
			// Row Major or Column Major?
			if (!rowMajor) {
				buffer[x * maxHeight + y] = temp;	
			}
			else {
				buffer[y * maxWidth + x] = temp;
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

	return [formatted, formatted_TM1680, imageRealWidth, imageRealHeight];
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
				if (i === rows - 1 || (j === cells - 1 && cells === disabledCol)) {
					continue;
				} else {
					$(row.cells[j]).addClass('on');
				}
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