
const file = document.getElementById("file");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const cameraBtn = document.getElementById("cameraBtn");
const video = document.getElementById("video");
video.style.display="none";

const CANVAS_SIZE = 500;

// Fixed canvas size
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

file.addEventListener("change", () => {

    const selectedFile = file.files[0];
    if (!selectedFile) return;

    const image = new Image();

    image.src = URL.createObjectURL(selectedFile);

    image.onload = async () => {

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Calculate image scale
        const scale = Math.min(
            CANVAS_SIZE / image.width,
            CANVAS_SIZE / image.height
        );

        const newWidth = image.width * scale;
        const newHeight = image.height * scale;

        const offsetX = (CANVAS_SIZE - newWidth) / 2;
        const offsetY = (CANVAS_SIZE - newHeight) / 2;

        // Draw resized image
        ctx.drawImage(
            image,
            offsetX,
            offsetY,
            newWidth,
            newHeight
        );

        // Send image to Flask
        const form = new FormData();
        console.log(form);
        form.append("image", selectedFile);

        const response = await fetch("/detect", {
            method: "POST",
            body: form
        });

        const boxes = await response.json();
        console.log(response.body);

        // Draw bounding boxes
        boxes.forEach(box => {

            const x = box.x1 * scale + offsetX;
            const y = box.y1 * scale + offsetY;
            const w = (box.x2 - box.x1) * scale;
            const h = (box.y2 - box.y1) * scale;

            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 2;

            ctx.strokeRect(x, y, w, h);

            const label =
                `${box.class} ${(box.confidence * 100).toFixed(1)}%`;

            ctx.font = "16px Arial";

            const textWidth = ctx.measureText(label).width;

            ctx.fillStyle = "#ff0000";
            ctx.fillRect(
                x,
                y - 24,
                textWidth + 10,
                24
            );

            ctx.fillStyle = "#ffffff";
            ctx.fillText(
                label,
                x + 5,
                y - 7
            );
        });

    };

});

let stream = null;
async function detectFromCamera() {
    if (!stream) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 500;
    tempCanvas.height = 500;
    const tctx = tempCanvas.getContext("2d");
    tctx.drawImage(video, 0, 0, 500, 500);

    const blob = await new Promise(resolve =>
        tempCanvas.toBlob(resolve, "image/jpeg")
    );

    const form = new FormData();
    form.append("image", blob, "frame.jpg");

    const response = await fetch("/detect", {
        method: "POST",
        body: form
    });

    const boxes = await response.json();

    // draw real-time boxes on main canvas
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(video, 0, 0, 500, 500);

    boxes.forEach(box => {

        const x = box.x1;
        const y = box.y1;
        const w = box.x2 - box.x1;
        const h = box.y2 - box.y1;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const label = `${box.class} ${(box.confidence * 100).toFixed(1)}%`;

        ctx.fillStyle = "red";
        ctx.fillRect(x, y - 20, ctx.measureText(label).width + 10, 20);

        ctx.fillStyle = "white";
        ctx.fillText(label, x + 5, y - 5);
    });

    requestAnimationFrame(detectFromCamera);
}
let isClick=false;
cameraBtn.addEventListener("click", async () => {
    isClick=!isClick;
    if(isClick){
        cameraBtn.innerHTML="Stop";
        stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
    
        video.srcObject = stream;
        video.play();
        detectFromCamera(); // 🚀 start YOLO loop
    }else{
            // Stop camera stream
           ctx.clearRect(0, 0, 500, 500);//clear box
        cameraBtn.innerHTML="Use Camera";
        if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        }
        video.srcObject = null;
    }

});

// const file = document.getElementById("file");
// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");

// const thumbs = document.getElementById("thumbs");
// const fpsText = document.getElementById("fps");
// const objCount = document.getElementById("objCount");

// const cameraBtn = document.getElementById("cameraBtn");
// const clearBtn = document.getElementById("clearBtn");

// const video = document.getElementById("video");
// video.style.display = "none";

// canvas.width = 500;
// canvas.height = 500;

// let stream = null;
// let last = performance.now();

// /* FPS */
// function fps() {
//     const now = performance.now();
//     const f = Math.round(1000 / (now - last));
//     last = now;
//     fpsText.innerText = "FPS: " + f;
// }

// /* BOX */
// function draw(box) {
//     ctx.strokeStyle = "#00ff88";
//     ctx.lineWidth = 2;
//     ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

//     const label = `${box.class} ${(box.confidence * 100).toFixed(1)}%`;

//     ctx.font = "14px Arial";
//     const w = ctx.measureText(label).width;

//     ctx.fillStyle = "#00ff88";
//     ctx.fillRect(box.x1, box.y1 - 18, w + 10, 18);

//     ctx.fillStyle = "#000";
//     ctx.fillText(label, box.x1 + 5, box.y1 - 5);
// }

// /* UPLOAD */
// file.addEventListener("change", async () => {

//     const files = [...file.files];

//     for (let f of files) {

//         const img = new Image();
//         img.src = URL.createObjectURL(f);

//         const t = document.createElement("img");
//         t.src = img.src;
//         thumbs.appendChild(t);

//         img.onload = async () => {

//             ctx.drawImage(img, 0, 0, 500, 500);

//             const form = new FormData();
//             form.append("image", f);

//             const res = await fetch("/detect", { method: "POST", body: form });
//             const boxes = await res.json();

//             objCount.innerText = "Objects: " + boxes.length;

//             boxes.forEach(draw);
//         };
//     }
// });
// let isRunning = false;
// /* CAMERA */
// async function loop() {
//     if (!stream) return;

//     ctx.drawImage(video, 0, 0, 500, 500);

//     const temp = document.createElement("canvas");
//     temp.width = 500;
//     temp.height = 500;

//     temp.getContext("2d").drawImage(video, 0, 0, 500, 500);

//     const blob = await new Promise(r => temp.toBlob(r, "image/jpeg"));

//     const form = new FormData();
//     form.append("image", blob, "frame.jpg");

//     const res = await fetch("/detect", { method: "POST", body: form });
//     const boxes = await res.json();

//     objCount.innerText = "Objects: " + boxes.length;

//     boxes.forEach(draw);

//     fps();

//     setTimeout(loop, 80);
// }

// /* CAMERA BUTTON */
// let isOpen=false;
// cameraBtn.onclick = async () => {
//     isOpen = !isOpen;

//     if (isOpen) {
//         cameraBtn.innerHTML="Close";
//         stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         video.srcObject = stream;
//         video.play();

//         isRunning = true;   // START loop
//         loop();
//     } else {
//         isRunning = false;  // STOP loop

//         if (stream) {
//             cameraBtn.innerHTML="Open";
//             stream.getTracks().forEach(track => track.stop());
//             stream = null;
//         }

//         video.srcObject = null;
//     }
// };

// /* CLEAR */
// clearBtn.onclick = () => {
//     ctx.clearRect(0, 0, 500, 500);
//     thumbs.innerHTML = "";
//     objCount.innerText = "Objects: 0";
// };