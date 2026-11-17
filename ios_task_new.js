Qualtrics.SurveyEngine.addOnload(function() {
    const question = this;
    const container = question.getQuestionContainer();

    if (container.closest(".MobilePreviewFrame")) {
        return;
    }

    const label_1 = "${e://Field/label_1}";
    const label_2 = "${e://Field/label_2}";
    const label_3 = "${e://Field/label_3}";

    const radius = parseInt("${e://Field/circle_radius}", 10);
    const label_font_size = "${e://Field/label_font_size}";

    const start_x_1 = parseInt("${e://Field/start_x_1}", 10);
    const start_y_1 = parseInt("${e://Field/start_y_1}", 10);
    const start_x_2 = parseInt("${e://Field/start_x_2}", 10);
    const start_y_2 = parseInt("${e://Field/start_y_2}", 10);
    const start_x_3 = parseInt("${e://Field/start_x_3}", 10);
    const start_y_3 = parseInt("${e://Field/start_y_3}", 10);

    const canvas = container.getElementsByClassName("myCanvas")[0];
    const ctx = canvas.getContext("2d");

    // Diagnostic text only; it does not confirm server-side persistence.
    const status = document.createElement("pre");
    status.style.cssText =
        "padding:10px;background:#eee;color:#000;" +
        "white-space:pre-wrap;font-size:13px;";
    status.textContent = "Version B: waiting for the page to be ready.";
    container.appendChild(status);

    var Arc = function(x, y, radius, radians, label) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.radians = radians;
        this.isDragging = false;
        this.label = label;

        this.render = function(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(
                this.x, this.y, this.radius,
                0, this.radians, false
            );
            ctx.stroke();

            ctx.font = label_font_size + "px Times New Roman";
            ctx.textAlign = "center";
            ctx.fillText(this.label, this.x, this.y);
            ctx.restore();
        };
    };

    const circle_array = [
        new Arc(start_x_1, start_y_1, radius, Math.PI * 2, label_1),
        new Arc(start_x_2, start_y_2, radius, Math.PI * 2, label_2),
        new Arc(start_x_3, start_y_3, radius, Math.PI * 2, label_3)
    ];

    function saveCirclePositions(reason) {
        const lines = [
            "Version B: setJSEmbeddedData",
            "Event: " + reason
        ];

        try {
            if (
                typeof Qualtrics.SurveyEngine.setJSEmbeddedData
                !== "function"
            ) {
                throw new Error("setJSEmbeddedData is not available.");
            }

            for (let i = 0; i < circle_array.length; i++) {
                // Pass the key WITHOUT __js_; the API adds that prefix.
                const xKey = "circle_x_" + (i + 1);
                const yKey = "circle_y_" + (i + 1);
                const x = String(circle_array[i].x);
                const y = String(circle_array[i].y);

                Qualtrics.SurveyEngine.setJSEmbeddedData(xKey, x);
                Qualtrics.SurveyEngine.setJSEmbeddedData(yKey, y);

                lines.push("__js_" + xKey + " = " + x);
                lines.push("__js_" + yKey + " = " + y);
            }

            lines.push(
                "Calls completed. Check a completed response to verify saving."
            );
        } catch (error) {
            lines.push("ERROR: " + error.message);
        }

        status.textContent = lines.join("\n");
    }

    var MouseTouchTracker = function(canvas, callback) {
        function processEvent(evt) {
            const rect = canvas.getBoundingClientRect();
            const point = evt.touches ? evt.touches[0] : evt;

            return {
                x: point.clientX - rect.left,
                y: point.clientY - rect.top
            };
        }

        function onDown(evt) {
            evt.preventDefault();
            const coords = processEvent(evt);
            callback("down", coords.x, coords.y);
        }

        function onUp(evt) {
            evt.preventDefault();
            callback("up");
        }

        function onMove(evt) {
            evt.preventDefault();
            const coords = processEvent(evt);
            callback("move", coords.x, coords.y);
        }

        canvas.ontouchmove = onMove;
        canvas.onmousemove = onMove;
        canvas.ontouchstart = onDown;
        canvas.onmousedown = onDown;
        canvas.ontouchend = onUp;
        canvas.onmouseup = onUp;
    };

    function isHit(shape, x, y) {
        const dx = shape.x - x;
        const dy = shape.y - y;

        return dx * dx + dy * dy < shape.radius * shape.radius;
    }

    const skinInner = document.getElementsByClassName("SkinInner")[0];
    if (skinInner) {
        skinInner.style.paddingTop = "0px";
    }

    let startX = 0;
    let startY = 0;

    function renderCircles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < circle_array.length; i++) {
            circle_array[i].render(ctx);
        }
    }

    renderCircles();

    new MouseTouchTracker(canvas, function(evtType, x, y) {
        switch (evtType) {
            case "down":
                startX = x;
                startY = y;

                for (let j = 0; j < circle_array.length; j++) {
                    if (isHit(circle_array[j], x, y)) {
                        circle_array[j].isDragging = true;
                    }
                }
                break;

            case "up":
                for (let k = 0; k < circle_array.length; k++) {
                    circle_array[k].isDragging = false;
                }

                saveCirclePositions("release");
                break;

            case "move":
                const dx = x - startX;
                const dy = y - startY;
                startX = x;
                startY = y;

                for (let m = 0; m < circle_array.length; m++) {
                    if (circle_array[m].isDragging) {
                        question.showNextButton();
                        circle_array[m].x += dx;
                        circle_array[m].y += dy;
                    }
                }
                break;
        }

        renderCircles();
    });

    Qualtrics.SurveyEngine.addOnReady(function() {
        question.hideNextButton();
        saveCirclePositions("page ready");
    });

    Qualtrics.SurveyEngine.addOnPageSubmit(function() {
        saveCirclePositions("page submit");
    });
});