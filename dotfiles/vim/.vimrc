set t_Co=256
set nocompatible
let g:currentmode={
	\ 'n': 'Normal',
	\ 'no' : 'N·Operator Pending',
	\ 'v'  : 'Visual',
	\ 'V'  : 'Visual·Line',
	\ '^V' : 'Visual·Block',
	\ 's'  : 'Select',
	\ 'S'  : 'Select·Line',
	\ '^S' : 'Select·Block',
	\ 'i'  : 'Insert',
	\ 'R'  : 'Replace',
	\ 'Rv' : 'Visual·Replace',
	\ 'c'  : 'Command',
	\ 'cv' : 'Vim Ex',
	\ 'ce' : 'Ex',
	\ 'r'  : 'Prompt',
	\ 'rm' : 'More',
	\ 'r?' : 'Confirm',
	\ '!'  : 'Shell',
	\ 't'  : 'Terminal'
	\}
"autocmd ColorScheme *
"function! SetColors(hex)
"	call system('echo ' . a:hex . ' > /home/vorap/.cache/colors')
"	return ''
"endfunction
highlight NonText guibg=NONE ctermbg=NONE |
highlight CursorLineNr term=NONE ctermfg=255 gui=NONE guifg=White |
highlight LineNr term=NONE ctermfg=255 gui=NONE guifg=White |
highlight StatusLine cterm=NONE ctermbg=NONE guibg=NONE guifg=Gray |
highlight StatusLineNC cterm=NONE ctermbg=NONE guibg=NONE ctermfg=0 |
highlight VertSplit term=NONE ctermbg=NONE guibg=NONE
let g:netrw_liststyle = 3
let g:netrw_banner = 0
let g:netrw_browse_split = 2
let g:netrw_winsize = 25
function! ChangeStatuslineColor()
  if (mode() =~# '\v(n|no)')
    exe 'hi! User1 guifg=White ctermfg=015'
  elseif (mode() =~# '\v(v|V)' || g:currentmode[mode()] ==# 'Visual·Block' || get(g:currentmode, mode(), '') ==# 't')
    exe 'hi! User1 guifg=blue ctermfg=033'
  elseif (mode() ==# 'i')
    exe 'hi! User1 guifg=green ctermfg=046'
  else
    exe 'hi! User1 guifg=gray ctermfg=012'
  endif
  return ''
endfunction
set tabstop=4
set shiftwidth=4
for prefix in ['i', 'n', 'v']
  for key in ['<Up>', '<Down>', '<Left>', '<Right>', '<Esc>', 'h', 'l']
    exe prefix . "noremap " . key . " <Nop>"
  endfor
endfor
inoremap h h
inoremap l l
nnoremap h :bp<cr>
nnoremap l :bn<cr>
set statusline=[%1*%{toupper(g:currentmode[mode()])}%0*]
set statusline+=[%t]
set statusline+=%y
set statusline+=%m
set statusline+=%{ChangeStatuslineColor()}
set statusline+=%=
set statusline+=[%l:%c]
set statusline+=[%{strftime('%c')}]
set statusline+=[%{system('python\ /home/vorap/Scripts/get_now_playing_spotify_linux.py')}]
set noruler
set fileencoding=utf-8
set laststatus=2
set encoding=utf-8
set langmenu=en_US
let $LANG = 'en_US'
set relativenumber
set list
set numberwidth=5
set guifont=DejaVu_Sans_Mono_for_Powerline:h11:cANSI:qDRAFT
set guioptions -=m
set guioptions -=T
set guioptions -=r
set guioptions -=L  "remove left-hand scroll bar
inoremap <C-u> <C-c>viwUi
nnoremap _ ddkP
nnoremap - ddp
set background=dark
set showbreak=↪
set listchars=tab:»\ ,eol:↲,nbsp:␣,trail:•,extends:⟩,precedes:⟨
echo '>^.^<'
set nocompatible
filetype indent plugin on | syn on
