// import {a} from './toolbar.js'
import html2canvas from './html2canvas.min.js'
import { css, remove, domType } from './util'
import createDragDom from './createDragDom.js'
import createToolbar from './toolbar/toolbar.js'
import drawMiddleImage from './toolbar/middleImage/drawMiddleImage'
import clearMiddleImage from './toolbar/middleImage/clearMiddleImage'
import endAndClear from './toolbar/endAndClear'
import backRightClient from './backRightClient'
import toolbarPosition from './toolbar/toolbarPosition'

let kss = (function () {
    const me = this

    let instance
    //单例模式
    let kss = function (key) {
        if (instance) {
            return instance
        }

        this.kss = null
        this.kssScreenShotWrapper = null
        this.rectangleCanvas = null
        this.toolbar = null
        //存储当前快照的元素
        this.currentImgDom = null
        //截图状态
        this.isScreenshot = false
        //快照组
        this.snapshootList = []
        /*
        * 1: 点下左键，开始状态
        * 2: 鼠标移动，进行状态
        * 3: 放开左键，结束状态
        * */
        this.drawingStatus = null
        this.currentToolType = null
        this.imgBase64 = null
        this.isEdit = false
        this.startX = null
        this.startY = null
        this.width = null
        this.height = null
        this.dotSize = 6
        this.lineSize = 2
        //工具栏样式
        this.toolbarWidth = 200
        this.toolbarHeight = 30
        this.toolbarMarginTop = 5
        this.toolbarColor = 'red'

        //工具栏事件
        this.toolmousedown = null
        this.toolmousemove = null
        this.toolmouseup = null
        
        this.startDrawDown = (e) => {
            const that = this
            document.addEventListener('mouseup', that.cancelDrawingStatus)
            document.addEventListener('contextmenu', that.preventContextMenu)
            //当不是鼠标左键时立即返回
            if (e.button !== 0) {
                return
            }
    
            if (that.drawingStatus !== null) {
                return
            }
            that.drawingStatus = 1
    
            that.startX = e.clientX
            that.startY = e.clientY
            //移除并添加
            remove(document.getElementById('kssScreenShotWrapper'))
            let kssScreenShotWrapper = document.createElement('div')
            kssScreenShotWrapper.id = 'kssScreenShotWrapper'
            css(kssScreenShotWrapper, {
                position: 'fixed',
                background: 'transparent',
                'box-shadow': '0 0 0 9999px rgba(0, 0, 0, 0.3)'
            })
            that.kssScreenShotWrapper = kssScreenShotWrapper
            let kssRectangle = document.createElement('div')
            css(kssRectangle, {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            })
            kssScreenShotWrapper.appendChild(kssRectangle)
            document.body.appendChild(kssScreenShotWrapper)
          
            document.addEventListener('mousemove', that.drawing)
            document.addEventListener('mouseup', that.endDraw)
        }

        this.drawing = (e) => {
            const that = this
            that.drawingStatus = 2
    
            let client = backRightClient(e)
            let clientX = client[0]
            let clientY = client[1]
            
            css(that.kssScreenShotWrapper, {
                height: Math.abs(clientY - that.startY) + 'px',
                width: Math.abs(clientX - that.startX) + 'px',
                top: Math.min(that.startY, clientY) + 'px',
                left: Math.min(that.startX, clientX) + 'px'
            })
        }

        this.endDraw = (e) => {
            if (e.button !== 0) {
                return
            }
            const that = this
            that.drawingStatus = 3
          
            if (that.startX === e.clientX && that.startY === e.clientY) {
                let clientHeight = document.documentElement.clientHeight
                let clientWidth = document.documentElement.clientWidth
                that.startX = 2
                that.startY = 2
                that.height = clientHeight - 4
                that.width = clientWidth - 4
                css(that.kssScreenShotWrapper, {
                    height: that.height + 'px',
                    width: that.width + 'px',
                    top: that.startY + 'px',
                    left: that.startX + 'px'
                })
            } else {
                let client = backRightClient(e)
                let clientX = client[0]
                let clientY = client[1]

                that.width = Math.abs(clientX - that.startX)
                that.height = Math.abs(clientY - that.startY)
                that.startX = Math.min(that.startX, clientX)
                that.startY = Math.min(that.startY, clientY)
            }
            document.removeEventListener('mousemove', that.drawing)
    
            let canvas = document.createElement('canvas')
        
            css(canvas, {
                height: '100%',
                width: '100%',
                top: 0,
                left: 0,
                cursor: 'move',
                position: 'absolute'
            })
            canvas.id = 'rectangleCanvas'
            that.kssScreenShotWrapper.appendChild(canvas)
            that.rectangleCanvas = canvas
            canvas.addEventListener('mousedown', function (event) {
                if (that.isEdit || event.button === 2) {
                    return
                }
                clearMiddleImage(that)
                let startX = event.clientX
                let startY = event.clientY
                document.addEventListener('mousemove', canvasMoveEvent)
                document.addEventListener('mouseup', canvasUpEvent)
                //最后左上角的top和left
                let top
                let left
                function canvasMoveEvent (e) {
                    let clientHeight = document.documentElement.clientHeight
                    let clientWidth = document.documentElement.clientWidth
              
                    top = that.startY + e.clientY - startY

                    if (that.startY + e.clientY - startY + that.height > clientHeight) {
                        top = clientHeight - that.height
                    }

                    if (that.startY + e.clientY - startY < 0) {
                        top = 0
                    }

                    left = that.startX + e.clientX - startX

                    if (that.startX + e.clientX - startX + that.width > clientWidth) {
                        left = clientWidth - that.width
                    }

                    if (that.startX + e.clientX - startX < 0) {
                        left = 0
                    }

                    css(that.kssScreenShotWrapper, {
                        top: top + 'px',
                        left: left + 'px'
                    })
                   
                    toolbarPosition(that, that.width, that.height, top, left, that.toolbar)
                }
    
                function canvasUpEvent (e) {
                    if (top === undefined) {
                        top = that.startY
                    }

                    if (left === undefined) {
                        left = that.startX
                    }
                    that.startY = top
                    that.startX = left
                    document.removeEventListener('mousemove', canvasMoveEvent)
                    document.removeEventListener('mouseup', canvasUpEvent)
                    drawMiddleImage(that)
                }
            })
            that.kss.removeEventListener('mousedown', that.startDrawDown)
            document.removeEventListener('mouseup', that.endDraw)
    
            createDragDom(
                that.kssScreenShotWrapper,
                that.dotSize,
                that.lineSize,
                '#488ff9',
                that
            )
            let img = document.createElement('img')
            css(img, {
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'none'

            })
            that.kssScreenShotWrapper.appendChild(img)
            that.currentImgDom = img
            drawMiddleImage(that)
            that.toolbar = createToolbar(that.toolbarWidth, that.toolbarHeight, that.toolbarMarginTop, that)
        }

        this.preventContextMenu = (e) => {
            e.preventDefault()
        }

        this.cancelDrawingStatus = (e) => {
            const that = this
            if (e.button === 2) {
                if (that.drawingStatus === null) {
                    document.removeEventListener('mouseup', that.cancelDrawingStatus)
                    setTimeout(function () {
                        document.removeEventListener('contextmenu', that.preventContextMenu)
                    }, 0)
                    
                    endAndClear(that)
                    return
                }
                remove(that.kssScreenShotWrapper)
                that.kssScreenShotWrapper = null
                that.rectangleCanvas = null
                that.drawingStatus = null
                that.isEdit = false
                that.snapshootList = []
                that.currentToolType = null
                that.toolmousedown = null
                that.toolmousemove = null
                that.toolmouseup = null
                that.kss.addEventListener('mousedown', that.startDrawDown)
            }
        }

        this.init(key)
        return instance = this
    }

    kss.prototype.init = function (key) {
        const that = this
   
        document.addEventListener('keydown', isRightKey.bind(null, key))

        function isRightKey (key, e) {
            if (e.keyCode === key && e.shiftKey && !that.isScreenshot) {
                that.isScreenshot = true
                css(document.body, {
                    cursor: 'url("./assets/imgs/cursor.ico"), auto',
                    'user-select': 'none'
                })
        
                that.start()
                that.end()
            }
        }
    }

    kss.prototype.start = function () {
        const that = this
        html2canvas(document.body, {useCORS:true})
            .then((canvas) => {
                that.kss = canvas
                css(canvas, {
                    position: 'fixed',
                    top: 0,
                    left: 0
                })
                canvas.id = 'kss'
     
                document.body.appendChild(canvas)

                canvas.addEventListener('mousedown', that.startDrawDown)
            })
    }

    kss.prototype.end = function () {
        const that = this
        document.addEventListener('keydown', endScreenShot)

        function endScreenShot (e) {
            if (e.keyCode === 27) {
                endAndClear(that)
            }
        }
    }

    return kss
})()

export default kss