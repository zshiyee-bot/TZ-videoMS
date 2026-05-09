import "./WebView.css";

import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import appContext from "../../components/app_context";
import FNote from "../../entities/fnote";
import attributes from "../../services/attributes";
import { t } from "../../services/i18n";
import toast from "../../services/toast";
import utils from "../../services/utils";
import Button from "../react/Button";
import FormGroup from "../react/FormGroup";
import FormTextBox from "../react/FormTextBox";
import { useNoteLabel } from "../react/hooks";
import SetupForm from "./helpers/SetupForm";
import { TypeWidgetProps } from "./type_widget";

const isElectron = utils.isElectron();
const HELP_PAGE = "1vHRoWCEjj0L";

export default function WebView({ note, ntxId }: TypeWidgetProps) {
    const [ webViewSrc ] = useNoteLabel(note, "webViewSrc");
    const [ disabledWebViewSrc ] = useNoteLabel(note, "disabled:webViewSrc");

    if (disabledWebViewSrc) {
        return <DisabledWebView note={note} url={disabledWebViewSrc} />;
    }

    if (!webViewSrc) {
        return <SetupWebView note={note} />;
    }

    return isElectron
        ? <DesktopWebView src={webViewSrc} ntxId={ntxId} />
        : <BrowserWebView src={webViewSrc} ntxId={ntxId} />;
}

function DesktopWebView({ src, ntxId }: { src: string, ntxId: string | null | undefined }) {
    const webviewRef = useRef<HTMLWebViewElement>(null);

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        function onBlur() {
            if (document.activeElement === webview && ntxId) {
                appContext.tabManager.activateNoteContext(ntxId);
            }
        }

        webview.addEventListener("focus", onBlur);
        return () => {
            webview.removeEventListener("focus", onBlur);
        };
    }, [ ntxId ]);

    return <webview
        ref={webviewRef}
        src={src}
        key={src}
        class="note-detail-web-view-content"
    />;
}

function BrowserWebView({ src, ntxId }: { src: string, ntxId: string | null | undefined }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 强制重新加载 iframe（已注释，新方案不需要手动刷新）
    // const forceReload = useCallback(() => {
    //     const iframe = iframeRef.current;
    //     if (!iframe) {
    //         console.log('[WebView] 无法刷新：iframe不存在');
    //         return;
    //     }

    //     console.log('[WebView] 强制重新加载 iframe');

    //     // 重新设置 src 来强制刷新
    //     const currentSrc = iframe.src;
    //     iframe.src = 'about:blank';
    //     setTimeout(() => {
    //         if (iframe) {
    //             iframe.src = currentSrc;
    //         }
    //     }, 50);
    // }, []);

    useEffect(() => {
        function onBlur() {
            if (document.activeElement === iframeRef.current && ntxId) {
                appContext.tabManager.activateNoteContext(ntxId);
            }
        }

        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("blur", onBlur);
        };
    }, [ ntxId ]);

    return (
        <iframe
            ref={iframeRef}
            src={src}
            className="note-detail-web-view-content"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
        // 刷新按钮已注释（新方案不需要）
        // <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        //     <iframe
        //         ref={iframeRef}
        //         src={src}
        //         className="note-detail-web-view-content"
        //         sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
        //         style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        //     />
        //     <button
        //         onClick={forceReload}
        //         className="webview-refresh-btn"
        //         title={t("web_view.refresh")}
        //         style={{
        //             position: 'absolute',
        //             top: '8px',
        //             right: '8px',
        //             zIndex: 1000,
        //             padding: '6px 12px',
        //             background: 'rgba(255, 255, 255, 0.9)',
        //             border: '1px solid #ddd',
        //             borderRadius: '4px',
        //             cursor: 'pointer',
        //             fontSize: '14px',
        //             display: 'flex',
        //             alignItems: 'center',
        //             gap: '4px',
        //             boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        //         }}
        //     >
        //         <i className="bx bx-refresh" />
        //         {t("web_view.refresh")}
        //     </button>
        // </div>
    );
}

function SetupWebView({note}: {note: FNote}) {
    const [ , setSrcLabel] = useNoteLabel(note, "webViewSrc");
    const [ src, setSrc ] = useState("");

    const submit = useCallback((url: string) => {
        try {
            // Validate URL
            new URL(url);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (ex) {
            toast.showErrorTitleAndMessage(t("web_view_setup.invalid_url_title"),
                t("web_view_setup.invalid_url_message"));
            return;
        }

        setSrcLabel(url);
    }, [ setSrcLabel ]);

    return (
        <SetupForm
            icon="bx bx-globe-alt" inAppHelpPage={HELP_PAGE}
            onSubmit={() => submit(src)}
        >
            <FormGroup name="web-view-src-detail" label={t("web_view_setup.title")}>
                <input className="form-control"
                    type="text"
                    value={src}
                    placeholder={t("web_view_setup.url_placeholder")}
                    onChange={(e) => {setSrc((e.target as HTMLInputElement)?.value);}}
                />
            </FormGroup>

            <Button
                text={t("web_view_setup.create_button")}
                kind="primary"
                keyboardShortcut="Enter"
            />
        </SetupForm>
    );
}

function DisabledWebView({ note, url }: { note: FNote, url: string }) {
    return (
        <SetupForm icon="bx bx-globe-alt" inAppHelpPage={HELP_PAGE}>
            <FormGroup name="web-view-src-detail" label={t("web_view_setup.disabled_description")}>
                <FormTextBox
                    type="url"
                    currentValue={url}
                    disabled
                />
            </FormGroup>

            <Button
                text={t("web_view_setup.disabled_button_enable")}
                icon="bx bx-check-shield"
                onClick={() => attributes.toggleDangerousAttribute(note, "label", "webViewSrc", true)}
                kind="primary"
            />
        </SetupForm>
    );
}
