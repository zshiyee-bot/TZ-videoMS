import Modal from "../react/Modal";
import { t } from "../../services/i18n";
import FormGroup from "../react/FormGroup";
import NoteAutocomplete from "../react/NoteAutocomplete";
import FormList, { FormListHeader, FormListItem } from "../react/FormList";
import { useEffect, useRef, useState } from "preact/hooks";
import note_types from "../../services/note_types";
import { MenuCommandItem, MenuItem } from "../../menus/context_menu";
import { TreeCommandNames } from "../../menus/tree_context_menu";
import { Suggestion } from "../../services/note_autocomplete";
import SimpleBadge from "../react/Badge";
import { useTriliumEvent } from "../react/hooks";
import { refToJQuerySelector } from "../react/react_utils";

export interface ChooseNoteTypeResponse {
    success: boolean;
    noteType?: string;
    templateNoteId?: string;
    notePath?: string;
}

export type ChooseNoteTypeCallback = (data: ChooseNoteTypeResponse) => void;

const SEPARATOR_TITLE_REPLACEMENTS = [
    t("note_type_chooser.builtin_templates"),
    t("note_type_chooser.templates")
];

export default function NoteTypeChooserDialogComponent() {
    const [ callback, setCallback ] = useState<ChooseNoteTypeCallback>();
    const [ shown, setShown ] = useState(false);
    const [ parentNote, setParentNote ] = useState<Suggestion | null>();
    const [ noteTypes, setNoteTypes ] = useState<MenuItem<TreeCommandNames>[]>([]);
    const [ collapsedSections, setCollapsedSections ] = useState<Set<number>>(new Set());
    const modalRef = useRef<HTMLDivElement>(null);
    const autocompleteRef = useRef<HTMLInputElement>(null);

    useTriliumEvent("chooseNoteType", ({ callback }) => {
        setCallback(() => callback);
        setShown(true);
    });

    useEffect(() => {
        note_types.getNoteTypeItems().then(noteTypes => {
            let index = -1;

            setNoteTypes((noteTypes ?? []).map((item) => {
                if ("kind" in item && item.kind === "separator") {
                    index++;
                    return {
                        kind: "header",
                        title: SEPARATOR_TITLE_REPLACEMENTS[index],
                        sectionIndex: index
                    }
                }

                return item;
            }));

            // 默认折叠所有分组
            const sectionCount = (noteTypes ?? []).filter(item => "kind" in item && item.kind === "separator").length;
            setCollapsedSections(new Set(Array.from({ length: sectionCount }, (_, i) => i)));
        });
    }, []);

    function onNoteTypeSelected(value: string) {
        const [ noteType, templateNoteId ] = value.split(",");

        callback?.({
            success: true,
            noteType,
            templateNoteId,
            notePath: parentNote?.notePath
        });
        setShown(false);
    }

    function toggleSection(sectionIndex: number) {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionIndex)) {
                newSet.delete(sectionIndex);
            } else {
                newSet.add(sectionIndex);
            }
            return newSet;
        });
    }

    return (
        <Modal
            modalRef={modalRef}
            title={t("note_type_chooser.modal_title")}
            className="note-type-chooser-dialog"
            size="md"
            zIndex={1100} // note type chooser needs to be higher than other dialogs from which it is triggered, e.g. "add link"
            scrollable
            onShown={() => {
                refToJQuerySelector(autocompleteRef)
                    .trigger("focus")
                    .trigger("select");
            }}
            onHidden={() => {
                callback?.({ success: false });
                setShown(false);
            }}
            show={shown}
            stackable
        >
            <FormGroup name="parent-note" label={t("note_type_chooser.change_path_prompt")}>
                <NoteAutocomplete
                    inputRef={autocompleteRef}
                    onChange={setParentNote}
                    placeholder={t("note_type_chooser.search_placeholder")}
                    opts={{
                        allowCreatingNotes: false,
                        hideGoToSelectedNoteButton: true,
                        allowJumpToSearchNotes: false,
                    }}
                />
            </FormGroup>

            <FormGroup name="note-type" label={t("note_type_chooser.modal_body")}>
                <FormList onSelect={onNoteTypeSelected}>
                    {noteTypes.map((_item, index) => {
                        if ("kind" in _item && _item.kind === "separator") {
                            return null;
                        }

                        const item = _item as MenuCommandItem<TreeCommandNames>;

                        if ("kind" in item && item.kind === "header") {
                            const sectionIndex = (item as MenuCommandItem<TreeCommandNames> & { sectionIndex?: number }).sectionIndex ?? 0;
                            const isCollapsed = collapsedSections.has(sectionIndex);

                            return <FormListHeader
                                key={`header-${sectionIndex}`}
                                text={item.title}
                                onClick={() => toggleSection(sectionIndex)}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                icon={isCollapsed ? 'bx-chevron-right' : 'bx-chevron-down'}
                            />;
                        } else {
                            // 找到当前项所属的分组
                            let currentSectionIndex = -1;
                            for (let i = index - 1; i >= 0; i--) {
                                const prevItem = noteTypes[i] as MenuCommandItem<TreeCommandNames> & { sectionIndex?: number };
                                if ("kind" in prevItem && prevItem.kind === "header") {
                                    currentSectionIndex = prevItem.sectionIndex ?? 0;
                                    break;
                                }
                            }

                            // 如果所属分组是折叠的，不显示该项
                            if (collapsedSections.has(currentSectionIndex)) {
                                return null;
                            }

                            return <FormListItem
                                key={`item-${index}`}
                                value={[ item.type, item.templateNoteId ].join(",") }
                                icon={item.uiIcon}>
                                {item.title}
                                {item.badges && item.badges.map((badge, badgeIndex) => <SimpleBadge key={badgeIndex} {...badge} />)}
                            </FormListItem>;
                        }
                    })}
                </FormList>
            </FormGroup>
        </Modal>
    );
}
