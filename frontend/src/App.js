import { TextField, MenuItem, Button, Typography, Link, CircularProgress, Snackbar, Alert, LinearProgress } from '@mui/material';
import { DataGrid, GridFooterContainer, GridPagination } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import LocalizedStrings from 'react-localization';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import styled from '@emotion/styled';
import RefreshIcon from '@mui/icons-material/Refresh';

class SessionExpired extends Error {
    constructor() {
        super('Session expired');
        this.name = this.constructor.name;
    }
}

class AccessDenied extends Error {
    constructor() {
        super('Access denied');
        this.name = this.constructor.name;
    }
}

class UndefinedException extends Error {
    constructor() {
        super('Undefined exception');
        this.name = this.constructor.name;
    }
}

const  
    jsonAcceptHeader = {
        Accept: 'application/json'
    },
    jsonContentTypeHeader = {
        'Content-Type': 'application/json'
    },
    baseUrl = "/api";

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function checkResponseForError(resp) {
    if (resp.ok) {
        return resp;
    }

    if (resp.status === 401) {
        throw new SessionExpired();
    } else if (resp.status === 403) {
        throw new AccessDenied(); 
    } else {
        throw new UndefinedException();
    }
}

function getUrl(url) {
    if (!(url instanceof URL)) {
        url = baseUrl + '/' + url;
    }
    return url;
}

async function get(url, headers=jsonAcceptHeader) {
    return fetch(getUrl(url), {
        method: 'GET',
        headers: headers
    })
        .then(checkResponseForError);
}

async function post(url, body, headers=jsonAcceptHeader) {
    return fetch(getUrl(url), {
        method: 'POST',
        body: body,
        headers: headers
    })
        .then(checkResponseForError);
}

const 
    strings = new LocalizedStrings({
        en: {
            title: 'Text summarizing',
            language: 'English',
            userNameField: 'User id',
            loginButton: 'LOGIN',
            welcome: 'Welcome',
            registreButton: 'SIGN UP',
            accessDenied: 'Access denied',
            undefinedException: 'An unexpected exception occurred, please try again later',
            fileName: 'File name',
            textHash: 'File hash',
            noRowsLabel: 'No rows, yet',
            labelRowsPerPage: 'Rows per page:',
            summarizeStatus: 'Summarize status',
            resultSummarizing: 'Result',
            pendingStatus: 'In process',
            successStatus: 'Successfully processed',
            errorStatus: 'Processing problem',
            expandButton: 'EXPAND',
            closeButton: 'CLOSE',
            processFileButton: 'Process file (max 1 MB)',
            fileToBig: 'File is to big'
        },
        ru: {
            title: 'Суммаризация текста',
            language: 'Русский',
            userNameField: 'ID пользователя',
            loginButton: 'ВОЙТИ',
            welcome: 'Вход',
            registreButton: 'СОЗДАТЬ',
            accessDenied: 'Доступ запрещён',
            undefinedException: 'Произошло непридвиденное исключение, попробуй позже',
            fileName: 'Имя файла',
            textHash: 'Хэш документа',
            noRowsLabel: 'Ещё нет данных',
            labelRowsPerPage: 'Строк на странице',
            summarizeStatus: 'Статус обработки',
            resultSummarizing: 'Результат',
            pendingStatus: 'В работе',
            successStatus: 'Успешно обработан',
            errorStatus: 'Ошибка во время обработки',
            expandButton: 'РАСКРЫТЬ',
            closeButton: 'ЗАКРЫТЬ',
            processFileButton: 'Обработать файл (макс 1 МБ)',
            fileToBig: 'Файл слишком большой'
        }
    }),
    defaultLanguage = 'en';
    
const 
    primaryColor = '#bbbbff',
    primaryColorFocused = '#acacfc',
    theme = createTheme({
        typography: {
            fontFamily: 'Helvetica',
        },
        palette: {
          primary: {
            main: primaryColor,
          },
        },
    }),
    FilledButton = styled(Button)({
        backgroundColor: primaryColor,
        '&:hover': {
            backgroundColor: primaryColorFocused,
        },
        '&.Mui-focusVisible': {
            backgroundColor: primaryColorFocused,
        }
    });

function LoginPage({setError, loggedIn}) {
    let [userId, setUserId] = useState(''),
        [pending, setPending] = useState(false);

    useEffect(() => {
        setPending(true);
        get('check_session')
            .then(loggedIn)
            .catch(() => {})
            .then(() => setPending(false));
    }, [])

    function handleSubmit(event) {
        event.preventDefault();
        setPending(true);

        let formData = new FormData();
        formData.append('username', userId);
        post('login', formData)
            .then(loggedIn)
            .catch(setError)
            .then(() => setPending(false));
    }

    function handleSignUp() {
        setPending(true);

        post('registration')
            .then(resp => resp.json())
            .then(json => setUserId(json.id))
            .catch(setError)
            .then(() => setPending(false))
    }
    
    return <div id='loginForm'>
        <div> 
            <Typography variant='h3'>{strings.welcome}</Typography>
            {
                pending ?
                <CircularProgress/> :
                <>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <TextField
                                required
                                label={strings.userNameField}
                                sx={{width: '100%'}}
                                value={userId}
                                onChange={event => setUserId(event.target.value)}
                            />
                        </div>
                        <div>
                            <FilledButton 
                                sx={{width: '100%'}} 
                                variant='filled'
                                type="submit"
                            >
                                {strings.loginButton}
                            </FilledButton>
                        </div>
                    </form>
                    <div>
                        <Link onClick={handleSignUp} component="button">{strings.registreButton}</Link>
                    </div>
                </>
            }
        </div>
    </div>
}

function PaginationWithReload({onReload, ...props}) {
    return (
      <GridFooterContainer>
        <GridPagination {...props}/>
        <Button onClick={onReload}>
          <RefreshIcon style={{color: 'black'}}/>
        </Button>
      </GridFooterContainer>
    );
  }

function MainComponent({setError}) {
    let [rows, setRows] = useState([]),
        [totalRows, setTotalRows] = useState(0),
        [page, setPage] = useState(0),
        [pageSize, setPageSize] = useState(20),
        [pending, setPending] = useState(false);


    function fetchRows() {
        setPending(true);
        get(`get_all_summarizing?page=${page}&pageSize=${pageSize}`)
            .then(resp => resp.json())
            .then(json => {
                setRows(json.content);
                setTotalRows(json.totalElements);
            })
            .catch(setError)
            .then(() => setPending(false))
    };

    function handleFileChange(event) {
        let file = event.target.files
        if (file) {
            file = file[0];
            let max1mb = 1048576;
            if (file.size > max1mb) {
                setError(new Error(strings.fileToBig))
            } else {
                let formData = new FormData();
                formData.append('file', file);
                setPending(true);
                post('summarize', formData)
                    .catch(setError)
                    .then(fetchRows)
            }
        }
    };

    useEffect(() => {
        fetchRows();
    }, [page, pageSize]);
    
    function renderExpandableCell(params) {
        const [open, setOpen] = useState(false);
    
        return (
          <div>
            {(params.value || '').length > 50 ? (
              <FilledButton sx={{color: 'black'}} onClick={() => setOpen(true)}>{strings.expandButton}</FilledButton>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>{params.value}</div>
            )}
            {open && (
              <div className='expandedText'>
                <div style={{ whiteSpace: 'pre-wrap', maxWidth: '800px' }}>{params.value}</div>
                <FilledButton sx={{color: 'black'}} onClick={() => setOpen(false)}>{strings.closeButton}</FilledButton>
              </div>
            )}
          </div>
        );
    }

    return <DataGrid
        slots={{
            loadingOverlay: LinearProgress,
        }}
        loading={pending}
        rows={rows}
        columns={[
            { field: 'id', headerName: 'ID', width: 5, sortable: false },
            { field: 'fileName', headerName: strings.fileName, width: 150, sortable: false },
            { field: 'textHash', headerName: strings.textHash, width: 300, sortable: false },
            { 
                field: 'summarizeStatus',
                headerName: strings.summarizeStatus,
                width: 200,
                sortable: false,
                valueFormatter: (params) => ({
                    'PENDING': strings.pendingStatus,
                    'SUCCESS': strings.successStatus,
                    'ERROR': strings.errorStatus
                }[params.value])
            },
            { field: 'resultSummarizing', headerName: strings.resultSummarizing, flex: 1, sortable: false, renderCell: renderExpandableCell},
        ]}
        pagination
        page={page}
        pageSize={pageSize}
        rowCount={totalRows}
        rowsPerPageOptions={[20, 40, 60, 80, 100]}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        localeText={{
            noRowsLabel: strings.noRowsLabel
        }}
        components={{
            Toolbar: () => {
                return <FilledButton component='label' sx={{color: 'black'}}>
                    {strings.processFileButton}
                    <input type='file' hidden onChange={handleFileChange} accept='.txt'/>
                </FilledButton>
            },
            Pagination: (props) => <PaginationWithReload onReload={fetchRows} {...props}/>
        }}
        componentsProps={{
            pagination: {
              labelRowsPerPage: strings.labelRowsPerPage
            }
        }}
        disableColumnSelector
        disableColumnMenu
        disableDensitySelector
    />
}

export default function App() {
    let [error, setError] = useState(null),
        [language, setLanguage] = useState(getCookie('language') || defaultLanguage),
        [isLoggedIn, setLoggedIn] = useState(false),
        mainEl;
    
    strings.setLanguage(language);

    useEffect(() => {
        document.title = strings.title;
    }, [language]);

    useEffect(() => {
        if (error && error instanceof SessionExpired) {
            setLoggedIn(false);
            setError(null);        
        }
    }, [error])

    if (isLoggedIn) {
        mainEl = <MainComponent language={language} setError={setError}/>
    } else {
        mainEl = <LoginPage language={language} setError={setError} loggedIn={setLoggedIn}/>;
    }

    return <ThemeProvider theme={theme}>
        <div id='appContainer'>
            <div>{mainEl}</div>
            <footer>
                <TextField 
                    select
                    required
                    value={language}
                    onChange={event => {
                        let v = event.target.value;
                        strings.setLanguage(v);
                        setLanguage(v);
                        setCookie('language', v);
                    }}
                    id='chooseLanguageField'
                >
                    {
                        Object
                            .entries(strings._props)
                            .map(it => <MenuItem key={it[0]} value={it[0]}>{it[1].language}</MenuItem>)
                    }
                </TextField>
            </footer>
            <Snackbar open={error && !(error instanceof SessionExpired)} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error">
                    {
                        !error || error instanceof SessionExpired ? '' :  
                        (error instanceof AccessDenied ? strings.accessDenied :
                        (error instanceof UndefinedException ? strings.undefinedException :
                        error.message))
                    }
                </Alert>
            </Snackbar>
        </div>
    </ThemeProvider>
}