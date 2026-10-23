// Mana is a GUI application in both debug and release Windows builds.
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

#[cfg(target_os="windows")]
fn set_taskbar_identity(){
    #[link(name="shell32")]extern "system" {fn SetCurrentProcessExplicitAppUserModelID(id:*const u16)->i32;}
    let id:Vec<u16>="com.mana.companion".encode_utf16().chain(std::iter::once(0)).collect();
    // Stable identity keeps the GUI separate from a launching terminal's group.
    unsafe {let _=SetCurrentProcessExplicitAppUserModelID(id.as_ptr());}
}
fn main() {
    #[cfg(target_os="windows")]set_taskbar_identity();
    mana_lib::run()
}
