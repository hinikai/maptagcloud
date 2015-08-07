/**
 * @author nikai (@胖嘟嘟的骨头, nikai@baidu.com)
 */

for (var i = 0, len = building.length; i < len; i++) {
    building[i].color = randomColor();
    building[i].size = parseInt(Math.random() * 20) + 10;
}

building.sort(function (a, b) {
    return b.size - a.size;
});

// 创建Map实例
var map = new BMap.Map("map"); 

var mercatorProjection = map.getMapType().getProjection();

map.centerAndZoom(new BMap.Point(116.405706, 39.927773), 12);     // 初始化地图,设置中心点坐标和地图级别
map.enableScrollWheelZoom();                            //启用滚轮放大缩小

map.setMapStyle({
    styleJson: [{
        featureType: 'water',
        elementType: 'all',
        stylers: {
            color: '#044161'
        }
    }, {
        featureType: 'land',
        elementType: 'all',
        stylers: {
            color: '#091934'
        }
    }, {
        featureType: 'boundary',
        elementType: 'geometry',
        stylers: {
            color: '#064f85'
        }
    }, {
        featureType: 'railway',
        elementType: 'all',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'highway',
        elementType: 'geometry',
        stylers: {
            color: '#004981'
        }
    }, {
        featureType: 'highway',
        elementType: 'geometry.fill',
        stylers: {
            color: '#005b96',
            lightness: 1
        }
    }, {
        featureType: 'highway',
        elementType: 'labels',
        stylers: {
            visibility: 'on'
        }
    }, {
        featureType: 'arterial',
        elementType: 'geometry',
        stylers: {
            color: '#004981',
            lightness: -39
        }
    }, {
        featureType: 'arterial',
        elementType: 'geometry.fill',
        stylers: {
            color: '#00508b'
        }
    }, {
        featureType: 'poi',
        elementType: 'all',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'green',
        elementType: 'all',
        stylers: {
            color: '#056197',
            visibility: 'off'
        }
    }, {
        featureType: 'subway',
        elementType: 'all',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'manmade',
        elementType: 'all',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'local',
        elementType: 'all',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'arterial',
        elementType: 'labels',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'boundary',
        elementType: 'geometry.fill',
        stylers: {
            color: '#029fd4'
        }
    }, {
        featureType: 'building',
        elementType: 'all',
        stylers: {
            color: '#1a5787'
        }
    }, {
        featureType: 'label',
        elementType: 'all',
        stylers: {
            visibility: 'off'
        }
    }, {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: {
            color: '#ffffff'
        }
    }, {
        featureType: 'poi',
        elementType: 'labels.text.stroke',
        stylers: {
            color: '#1e1c1c'
        }
    }]
});

var canvasLayer = new CanvasLayer({
    map: map,
    update: update
});

var ctx = canvasLayer.canvas.getContext("2d");

function update() {
    var ctx = this.canvas.getContext("2d");

    var zoom = map.getZoom();
    var zoomUnit = Math.pow(2, 18 - zoom);
    var mcCenter = mercatorProjection.lngLatToPoint(map.getCenter());
    var nwMc = new BMap.Pixel(mcCenter.x - (ctx.canvas.width / 2) * zoomUnit, mcCenter.y + (ctx.canvas.height / 2) * zoomUnit); //左上角墨卡托坐标

    if (!ctx) {
        return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var temp = {};
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(250, 250, 55, 0.7)";
    ctx.beginPath();

    ctx.textBaseline = "top";

    for (var i = 0, len = building.length; i < len; i++) {
        var x = (building[i].x - nwMc.x) / zoomUnit;
        var y = (nwMc.y - building[i].y) / zoomUnit;

        building[i].px = x;
        building[i].py = y;
    }

    var rects = [];

    var canvasWidth = ctx.canvas.width;
    var canvasHeight = ctx.canvas.height;
    var margin = 200; // canvas扩大范围绘制，使边缘展示一致
    for (var i = 0, len = building.length; i < len; i++) {
        var x = building[i].px;
        var y = building[i].py
        
        if (x < -margin || y < -margin || x > canvasWidth + margin || y > canvasHeight + margin) {
            continue;
        }

        ctx.font = "bold " + building[i].size + "px Arial";
        var textWidth = ctx.measureText(building[i].n).width;
        
        // 根据文本宽度和高度调整x，y位置，使得绘制文本时候坐标点在文本中心点，这个计算出的是左上角坐标
        var px = x - textWidth / 2; 
        var py = y - building[i].size / 2;

        var rect = {
            sw: {
                x: px,
                y: py + building[i].size
            },
            ne: {
                x: px + textWidth,
                y: py 
            }
        }
        if (!hasOverlay(rects, rect)) {
            rects.push(rect);
            ctx.fillStyle = building[i].color;
            // ctx.fillRect(px, py, textWidth, building[i].size);
            ctx.fillText(building[i].n, px, py);
        }
    }
}

/*
 *  当前文字区域和已有的文字区域是否有重叠部分
 */
function hasOverlay(rects, overlay) {
    for (var i = 0; i < rects.length; i++) {
        if (isRectOverlay(rects[i], overlay)) {
            return true;
        }
    }
    return false;
}

//判断2个矩形是否有重叠部分
function isRectOverlay(rect1, rect2) {
    //minx、miny 2个矩形右下角最小的x和y
    //maxx、maxy 2个矩形左上角最大的x和y
    var minx = Math.min(rect1.ne.x, rect2.ne.x);
    var miny = Math.min(rect1.sw.y, rect2.sw.y);
    var maxx = Math.max(rect1.sw.x, rect2.sw.x);
    var maxy = Math.max(rect1.ne.y, rect2.ne.y);
    if (minx > maxx && miny > maxy) {
        return true;
    }
    return false;
}
