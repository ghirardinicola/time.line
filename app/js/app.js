(function (NS) {
    "use strict";

    var links = NS.links,
        $ = NS.jQuery,
        moment = NS.moment,
        google = NS.google,
        resources = {
            "atti": [
                "json/data_cluster_mensile.json",
            ],
            "atti2": [
                "json/data_cluster_mensile.json"
            ],
            "legislature": [
                "json/data_legislature.json"
            ]
        },
        baseOptions = {
            width: '100%',
            height: 'auto',
            layout: "box",
            eventMargin: 0,  // minimal margin between events
            eventMarginAxis: 4, // minimal margin beteen events and the axis
            editable: false,   // enable dragging and editing events
            style: 'box',
            stackEvents: true
        },
        stackedOptions = $.extend(true, {stackEvents: true}, baseOptions),
        unStackedOptions = $.extend(true, {stackEvents: false, eventMarginAxis: 0}, baseOptions),
        visibleTimelines = [];

    function itemClassByContent(type, content) {
        switch (type) {
            case 'atti':
            case 'ddl':
            case 'pdl':
            case 'pdlc':

                if (content.count > 50) {
                    // console.log('a');
                    return 'high item-' + type;
                } else {
                    //console.log('b');
                    return 'low item-' + type;

                }
                break;
            default:
                // console.log('c');
                return 'item-' + type;
                break;
        }
    }

    function parsePayload(payload) {
        var idx,
            data = [],
            start,
            end,
            content,
            each,
            item;

        for (idx = 0; idx < payload.length; idx++) {
            each = payload[idx];
            start = each.start;
            content = each.content;
            item = {
                "start": moment(start)
            };
            end = each.end;
            item.content = (content.hasOwnProperty("count")) ? content.count : content.title;
            item.count = content.count;
            if (end) {
                item.end = moment(end);
            }
            item.className = itemClassByContent(each.type, each.content);
            data.push(item);
        }

        return data;
    }

    function renderResources(urls, renderer) {
        var idx,
            data = [],
            urlsNum = urls.length,
            fetchCount = 0;

        function build(payload) {
            data = data.concat(parsePayload(payload));
            fetchCount++;
            if (fetchCount === urlsNum) {
                renderer.draw(data);
            }
        }

        for (idx = 0; idx < urlsNum; idx++) {
            $.get(urls[idx], null, build, "json");
        }
    }

    var updateVisualizations = function () {
        var source,
            sourceRange,
            idx,
            idsLen = visibleTimelines.length;

        if (idsLen > 1) {
            source = visibleTimelines[0];
            sourceRange = source.getVisibleChartRange();
            for (idx = 1; idx < idsLen; idx++) {
                var target = visibleTimelines[idx];
                target.setVisibleChartRange(
                    sourceRange.start,
                    sourceRange.end
                );
            }
        }
    };

    var getRenderer = function (rendererName) {
        var renderer;
        if (rendererName === "timeline") {
            return function (elem, urls) {
                renderer = new links.Timeline(elem, (urls.length > 1) ? stackedOptions : unStackedOptions);
                visibleTimelines.push(renderer);
                return renderer;
            };
        } else if (rendererName === "graph") {
            return function (elem, urls) {

                google.load("visualization", "1");

                // Set callback to run when API is loaded
                google.setOnLoadCallback(drawVisualization);

                // Called when the Visualization API is loaded.
                function drawVisualization() {
                    // Create and populate a data table.
                    var data = new google.visualization.DataTable();
                    data.addColumn('datetime', 'time');
                    data.addColumn('number', 'Function A');

                    function functionA(x) {
                        return Math.sin(x / 25) * Math.cos(x / 25) * 50 + (Math.random() - 0.5) * 10;
                    }

                    // create data
                    var d = new Date(2010, 9, 23, 20, 0, 0);
                    for (var i = 0; i < 100; i++) {
                        data.addRow([new Date(d), 10]);
                        d.setMinutes(d.getMinutes() + 1);
                    }

                    // specify options
                    var options = {
                        "width": "100%",
                        "height": "350px",
                        "showTooltip": true,
                        "legend": false
                    };

                    // Instantiate our graph object.
                    var graph = new links.Graph(elem);

                    // Draw our graph with the created data and options
                    graph.draw(data, options);

                    visibleTimelines.push(graph);
                }
            }
        }
        return undefined;

    };

    var drawVisualization = function (targetDatasetName, visType, idx) {
        var elem = NS.document.getElementById(targetDatasetName),
            urls = resources[targetDatasetName],
            renderer = getRenderer(visType)(elem, urls);

        renderResources(urls, renderer);

        links.events.addListener(
            renderer,
            'rangechange',
            function () {
                updateVisualizations(idx);
            }
        );

        if (visType !== "graph") {
            updateVisualizations(idx);
        }
    };

    drawVisualization("atti", "timeline", 0);
    drawVisualization("legislature", "timeline", 1);
    drawVisualization("atti2", "graph", 2);

    setTimeout(function () {
        updateVisualizations(2);
    }, 1000);

    NS._vis = visibleTimelines;

}(this));