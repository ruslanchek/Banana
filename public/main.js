var config = {
    fontSize: 14,
    fontFamily: 'Arial',
    textColor: '#000',
    diagramStrokeColor: '#FFC701',
    diagramFillColor: 'RGBA(255, 199, 1, .35)',
    diagramStrokeWidth: 1,
    stepsY: 8,
    stepsX: 5,
    gridOffsetX: 80,
    gridOffsetY: 40,
    gridStrokeColor: '#ccc',
    socket: 'ws://104.131.7.135:8080/socket',
    authToken: 'fredclark201590@gmail.com/fredclark201590@gmail.com'
};

var Line = function(x1, y1, x2, y2, color, strokeWidth, context){
    context.beginPath();
    context.lineWidth = strokeWidth;
    context.strokeStyle = color;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
};

var Diagram = function(canvas, context){
    var _sizes;

    function calcX(val, startPos){
        return (((val - startPos) / 60) * _sizes.stepWidth + _sizes.offsetX) + .5;
    }

    function calcY(val, min, max){
        var y = (max - min) / 100;

        return -((val - min) / y) + _sizes.height;
    }

    this.draw = function(points, sizes){
        _sizes = sizes;

        context.beginPath();
        context.lineWidth = config.diagramStrokeWidth;
        context.strokeStyle = config.diagramStrokeColor;

        var min = 0, 
            max = 0, 
            minCountArr = [];

        for(var i = 0, l = points.length; i < l; i++){
            if(points[i][1] > max){
                max = points[i][1];
            }

            minCountArr.push(points[i][1]);
        }

        min = Math.min.apply(Math, minCountArr);
        
        for(var i = 0, l = points.length; i < l; i++){
            context.lineTo(
                calcX(points[i][0], points[0][0]),
                calcY(points[i][1], min, max)
            );
        }

        // br
        context.lineTo(calcX(points[points.length - 1][0], points[0][0]), _sizes.height + _sizes.offsetY - .5);

        // bl
        context.lineTo(_sizes.offsetX + .5, _sizes.height + _sizes.offsetY - .5);

        // tl
        context.lineTo(
            calcX(points[0][0], points[0][0]), 
            calcY(points[0][1], min, max)
        );

        context.stroke();

        context.fillStyle = config.diagramFillColor;

        context.fill();
    }
};

var Text = function(x, y, text, context, centerX, centerY){
    context.font = config.fontSize + 'px ' + config.fontFamily;

    if(centerX){
        x = x - context.measureText(text).width / 2;
    }

    if(centerY){
        y = y + config.fontSize / 3;
    }

    context.fillStyle = config.textColor;
    context.fillText(text, x, y);
}

var Grid = function(canvas, context){
    var offsetX = config.gridOffsetX,
        offsetY = config.gridOffsetY,
        width = 0,
        height = 0,
        stepWidth = 0,
        stepHeight = 0,
        cWidth = canvas.width,
        cHeight = canvas.height,
        startOffsetX = 0;

    var timeConvert = function(val){
        var date = new Date(Math.floor(val) * 1000),
            h = (date.getHours() >= 10) ? date.getHours() : '0' + date.getHours(),
            m = (date.getMinutes() >= 10) ? date.getMinutes() : '0' + date.getMinutes(),
            text = h + ':' + m + ':00';

        return text;
    };

    var drawX = function(items){
        var steps = items.length;

        while(steps > 0){
            steps--;

            var x = (stepWidth * steps) + .5 + offsetX;

            new Line(x, offsetY, x, height + offsetY, config.gridStrokeColor, 1, context);
            new Text(x, height + offsetY + 20, timeConvert(items[steps]), context, true, false);
        }

        startOffsetX = items[0];

        new Line(offsetX, offsetY - .5, width + offsetX, offsetY - .5, config.gridStrokeColor, 1, context);
    }

    var drawY = function(items){
        var steps = items.length,
            i = 0;

        for(var i = 0, l = steps; i < l; i++){
            var y = (height - stepHeight * i) - .5 + offsetY;

            new Line(offsetX, y, width + offsetX, y, config.gridStrokeColor, 1, context);
            new Text(width + 10 + offsetX, y, items[i], context, false, true);
        }

        new Line(width + offsetX + .5, offsetY - 1, width + offsetX + .5, height + offsetY - .5, config.gridStrokeColor, 1, context);
    }

    var countSizes = function(stepsX, stepsY){
        stepWidth = Math.round((cWidth - offsetX * 2) / stepsX);
        stepHeight = Math.round((cHeight - offsetY * 2) / stepsY);

        width = stepWidth * stepsX;
        height = stepHeight * stepsY;
    }

    this.draw = function(dataX, dataY){
        countSizes(dataX.length, dataY.length);

        drawX(dataX);
        drawY(dataY);
    };

    this.getSizes = function(){
        return {
            offsetX: offsetX,
            offsetY: offsetY,
            width: width,
            height: height,
            stepWidth: stepWidth,
            stepHeight: stepHeight,
            cWidth: cWidth,
            cHeight: cHeight,
            startOffsetX: startOffsetX
        };
    };
};

var Plot = function(canvasId){
    var canvas = document.getElementById(canvasId),
        context = canvas.getContext('2d'),
        grid = new Grid(canvas, context),
        diagram = new Diagram(canvas, context);

    function getGridX(data){
        var min = data[0][0],
            result = [],
            i = 0;

        while(i < config.stepsX){
            var date = new Date(min * 1000);

            date.setMinutes(date.getMinutes() + i);

            var item = date.getTime() / 1000;

            result.push(item);

            i++;
        }

        return result;
    }

    function getGridY(data){
        var min = 0,
            max = 0,
            result = [],
            steps = config.stepsY,
            minCountArr = [];

        for(var i = 0, l = data.length; i < l; i++){
            minCountArr.push(data[i][1]);
        }

        min = Math.min.apply(Math, minCountArr);

        for(var i = 0, l = data.length; i < l; i++){
            if(max < data[i][1]){
                max = data[i][1];
            }
        }

        var range = max - min,
            rangeStep = range / config.stepsY,
            curr = min;

        while(curr < max){
            curr += rangeStep;

            result.push(curr.toFixed(6));
        }

        return result;
    }

    this.clearCanvas = function(){
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.draw = function(data){
        this.clearCanvas();

        var gridData = {
            x: getGridX(data),
            y: getGridY(data)
        };

        grid.draw(gridData.x, gridData.y);

        diagram.draw(data, grid.getSizes());
    };
};

var Data = function(){
    var ws,
        plot = new Plot('scene-1'),
        data = [];
        loading = document.getElementById('loading');

    function setWS(){
        ws = new WebSocket(config.socket);

        ws.onopen = function(event) {
            setTimeout(function(){
                loading.className = 'ready';
                loading.innerHTML = 'Loading...';

                setTimeout(function(){
                    loading.className = 'hidden';
                }, 1500);
            
                ws.send(JSON.stringify({
                    action: 'token',
                    message: {
                        token: config.authToken
                    }
                }));

            }, 1000);
        };

        ws.onmessage = function(event) {
            loading.className = 'hidden';

            var data = {};

            try {
                data = JSON.parse(event.data);
            } catch(e){
                data = {error: true};
            }

            processData(data);
        };
    }

    function setUserData(data){
        if(data.name){
            var username = document.getElementById('username');

            var balance = '';

            if(data.balance || data.balance === 0){
                balance = '. Your balance is <span>' + data.balance + '</span>.';
            }

            username.className = '';
            username.innerHTML = 'Hello, ' + data.name + balance;
        }
    }

    function setAssetsData(assets){
        var html = '',
            selector = document.getElementById('asset-type'),
            selected = '';

        for(var i = 0, l = assets.length; i < l; i++){
            if(assets[0].id == assets[i].id){
                selected = 'selected';
            }else{
                selected = '';
            }

            html += '<option ' + selected + ' value="' + assets[i].id + '">' + assets[i].name + '</option>';
        }

        selector.innerHTML = html;

        selector.addEventListener('change', function(e){
            selectAsset(e.target.value);
        });

        selector.parentNode.className = 'asset-type-selector';

        selectAsset(assets[0].id);
    }

    function processData(data){
        if(data && data.message && data.action){
            if(data.action == 'profile'){
                setUserData(data.message);
            }
            
            if(data.action == 'assets'){
                setAssetsData(data.message.assets);
            }

            if(data.action == 'asset_history'){
                pushPlotData(data.message.points);
            }

            if(data.action == 'point'){
                pushPlotData([data.message]);
            }
        }
    }

    function subscribeToAssetData(id){
        ws.send(JSON.stringify({
            action: 'subscribe',
                'message': {
                'assetId': id
            }
        }));
    }

    function clearData(){
        data = [];
    }

    function selectAsset(id){
        subscribeToAssetData(id);
        clearData();
        plot.clearCanvas();
    }

    function pushPlotData(points){
        for(var i = 0, l = points.length; i < l; i++){
            data.push([points[i].time / 1000, points[i].value]);
        }

        if(data.length > (60 * config.stepsX) - 19){
            data.shift();
        }

        plot.draw(data);
    }

    setWS();
};

var data;

window.onload = function() {
    data = new Data();
};